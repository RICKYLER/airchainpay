use actix_web::{App, HttpServer, web};

use std::sync::Arc;
use airchainpay_relay::infrastructure::config::DynamicConfigManager;
use airchainpay_relay::infrastructure::storage::file_storage::Storage;
use airchainpay_relay::infrastructure::blockchain::manager::BlockchainManager;
use airchainpay_relay::domain::auth::AuthManager;
use airchainpay_relay::infrastructure::monitoring::manager::MonitoringManager;
use airchainpay_relay::utils::error_handler::EnhancedErrorHandler;
use airchainpay_relay::utils::backup::BackupManager;
use airchainpay_relay::utils::audit::AuditLogger;
use airchainpay_relay::infrastructure::logger::Logger;
use airchainpay_relay::app::transaction_service::TransactionProcessor;
use airchainpay_relay::utils::backup::BackupConfig;
use airchainpay_relay::middleware::metrics::MetricsMiddleware;
use airchainpay_relay::middleware::error_handling::ErrorHandlingMiddleware;
use airchainpay_relay::middleware::rate_limiting::RateLimitingMiddleware;
use airchainpay_relay::middleware::ComprehensiveSecurityMiddleware;
use airchainpay_relay::api::*;
use airchainpay_relay::api::handlers::transaction::{
    validate_inputs, simple_send_tx, get_transaction_details, 
    get_transaction_status, get_user_transactions, get_supported_chains, get_chain_info, get_transaction_by_hash
};
use airchainpay_relay::utils::animated_ascii;
use std::env;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Display animated ASCII logo
    animated_ascii::display_animated_logo();
    
    // Initialize logger
    Logger::init("info");
    
    log::info!("🚀 Starting AirChainPay Relay Server...");
    
    // Initialize dynamic configuration manager with error handling
    let config_manager = match DynamicConfigManager::new() {
        Ok(manager) => {
            log::info!("✅ Configuration manager initialized successfully");
            Arc::new(manager)
        }
        Err(e) => {
            log::error!("❌ Failed to initialize configuration manager: {}", e);
            return Err(std::io::Error::new(std::io::ErrorKind::Other, format!("Configuration initialization failed: {}", e)));
        }
    };
    
    // Get initial configuration
    let config = config_manager.get_config().await;
    log::info!("✅ Configuration loaded successfully");
    
    // Validate configuration before blockchain manager init
    log::info!("🔍 Validating configuration...");
    let validation_errors = config_manager.validate_config().await
        .unwrap_or_else(|e| vec![format!("Validation error: {}", e)]);
    if !validation_errors.is_empty() {
        log::error!("❌ Configuration validation failed: {}", validation_errors.join(", "));
        return Err(std::io::Error::new(
            std::io::ErrorKind::Other,
            format!("Configuration validation failed: {}", validation_errors.join(", ")),
        ));
    }
    log::info!("✅ Configuration validation passed");
    
    // Validate contract addresses with detailed error logging
    log::info!("🔍 Validating contract addresses...");
    for (chain_id, chain_config) in &config.supported_chains {
        if !airchainpay_relay::infrastructure::config::Config::is_valid_hex_address(&chain_config.contract_address) {
            log::error!("❌ Invalid contract address for chain {} ({}): '{}'", 
                chain_id, chain_config.name, chain_config.contract_address);
            return Err(std::io::Error::new(
                std::io::ErrorKind::Other, 
                format!("Invalid contract address for chain {}: {}", chain_id, chain_config.contract_address)
            ));
        }
        log::info!("✅ Contract address for chain {} ({}): {}", 
            chain_id, chain_config.name, chain_config.contract_address);
    }
    log::info!("✅ All contract addresses validated successfully");
    
    // Initialize storage with error handling
    let storage = match Storage::new() {
        Ok(storage) => {
            log::info!("✅ Storage initialized successfully");
            Arc::new(storage)
        }
        Err(e) => {
            log::error!("❌ Failed to initialize storage: {}", e);
            return Err(std::io::Error::new(std::io::ErrorKind::Other, format!("Storage initialization failed: {}", e)));
        }
    };
    
    // Initialize blockchain manager with error handling
    let blockchain_manager = match BlockchainManager::new(config.clone()) {
        Ok(manager) => {
            log::info!("✅ Blockchain manager initialized successfully");
            Arc::new(manager)
        }
        Err(e) => {
            log::error!("❌ Failed to initialize blockchain manager: {}", e);
            return Err(std::io::Error::new(std::io::ErrorKind::Other, format!("Blockchain manager initialization failed: {}", e)));
        }
    };
    
    // Initialize auth manager
    let auth_manager = Arc::new(AuthManager::new());
    log::info!("✅ Auth manager initialized successfully");
    
    // Initialize monitoring manager
    let monitoring_manager = Arc::new(MonitoringManager::new());
    log::info!("✅ Monitoring manager initialized successfully");
    
    // Initialize backup manager
    let backup_config = BackupConfig::default();
    let backup_manager = Arc::new(BackupManager::new(backup_config, "data".to_string())
        .with_monitoring(Arc::clone(&monitoring_manager)));
    log::info!("✅ Backup manager initialized successfully");
    
    // Start automatic backup
    BackupManager::start_auto_backup(Arc::clone(&backup_manager));
    log::info!("✅ Auto backup started successfully");
    
    // Initialize audit logger
    let audit_logger = Arc::new(AuditLogger::new("audit.log".to_string(), 10000)
        .with_monitoring(Arc::clone(&monitoring_manager)));
    log::info!("✅ Audit logger initialized successfully");
    
    // Initialize enhanced error handler
    let error_handler = Arc::new(EnhancedErrorHandler::new());
    log::info!("✅ Error handler initialized successfully");
    
    // Initialize enhanced transaction processor
    let transaction_processor = Arc::new(TransactionProcessor::new(
        Arc::clone(&blockchain_manager),
        Arc::clone(&storage),
        None, // Use default config
    ));
    log::info!("✅ Transaction processor initialized successfully");
    
    // Start the transaction processor with error handling
    if let Err(e) = transaction_processor.start().await {
        log::error!("❌ Failed to start transaction processor: {}", e);
        return Err(std::io::Error::new(std::io::ErrorKind::Other, format!("Transaction processor startup failed: {}", e)));
    }
    log::info!("✅ Transaction processor started successfully");
    
    // Get port from environment or use default
    let port = env::var("PORT").unwrap_or_else(|_| "4000".to_string()).parse::<u16>().unwrap_or(4000);
    
    log::info!("🌐 Starting AirChainPay Relay Server on port {}", port);
    log::info!("📊 Environment: {}", config.environment);
    log::info!("🔗 Supported chains: {}", config.supported_chains.len());
    
    HttpServer::new(move || {
        App::new()
            // Global built-in middleware only
            .wrap(actix_web::middleware::Logger::default())
            .wrap(actix_web::middleware::Compress::default())
            .wrap(actix_cors::Cors::permissive())
            .app_data(web::Data::new(Arc::clone(&storage)))
            .app_data(web::Data::new(Arc::clone(&blockchain_manager)))
            .app_data(web::Data::new(Arc::clone(&auth_manager)))
            .app_data(web::Data::new(Arc::clone(&monitoring_manager)))
            .app_data(web::Data::new(Arc::clone(&backup_manager)))
            .app_data(web::Data::new(Arc::clone(&audit_logger)))
            .app_data(web::Data::new(Arc::clone(&transaction_processor)))
            .app_data(web::Data::new(Arc::clone(&config_manager)))
            // Health endpoints (no custom middleware)
            .service(health)
            .service(detailed_health)
            .service(component_health)
            .service(health_alerts)
            .service(resolve_alert)
            .service(health_metrics)
            .service(contract_health_check)
            .service(detailed_contract_health_check)
            // API endpoints with custom middleware
            .service(
                web::scope("/api")
                    .wrap(ComprehensiveSecurityMiddleware::new(
                        airchainpay_relay::middleware::EnhancedSecurityConfig::default()
                    ))
                    .wrap(MetricsMiddleware::new(
                        Arc::clone(&monitoring_manager)
                    ))
                    .wrap(ErrorHandlingMiddleware::new(
                        Arc::clone(&error_handler)
                    ))
                    .wrap(RateLimitingMiddleware::new(
                        100, // 100 requests per window
                        10,  // 10 burst requests
                        std::time::Duration::from_secs(60) // 1 minute window
                    ))
                    .service(submit_transaction)
                    .service(legacy_submit_transaction)
                    .service(test_transaction)
                    .service(create_backup)
                    .service(restore_backup)
                    .service(list_backups)
                    .service(get_backup_info)
                    .service(delete_backup)
                    .service(verify_backup)
                    .service(get_backup_stats)
                    .service(cleanup_backups)
                    .service(get_audit_events)
                    .service(get_security_events)
                    .service(get_failed_events)
                    .service(get_critical_events)
                    .service(get_events_by_user)
                    .service(get_events_by_device)
                    .service(get_audit_stats)
                    .service(export_audit_events)
                    .service(clear_audit_events)
                    .service(get_error_statistics)
                    .service(reset_error_statistics)
                    .service(get_circuit_breaker_status)
                    .service(reset_circuit_breaker)
                    .service(test_error_handling)
                    .service(get_error_summary)
                    .service(get_configuration)
                    .service(reload_configuration)
                    .service(export_configuration)
                    .service(import_configuration)
                    .service(validate_configuration)
                    .service(get_configuration_summary)
                    .service(update_configuration_field)
                    .service(save_configuration_to_file)
                    .service(process_transaction)
                    .service(validate_inputs)
                    .service(simple_send_tx)
                    .service(get_transactions)
                    .service(get_transaction_details)
                    .service(get_transaction_status)
                    .service(get_user_transactions)
                    .service(get_supported_chains)
                    .service(get_chain_info)
                    .service(get_transaction_by_hash)
                    .service(get_metrics)
                    .service(get_devices)
            )
    })
    .bind(("0.0.0.0", port))?
    .run()
    .await
}
