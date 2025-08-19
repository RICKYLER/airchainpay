//! Transaction processing functionality
//! 
//! This module contains transaction creation, signing, and management.

use crate::shared::error::WalletError;
use crate::shared::types::{Transaction, SignedTransaction, TransactionHash, TransactionStatus, Network, Amount};
use crate::core::crypto::signatures::SignatureManager;
use reqwest::Client;
use serde_json::json;

/// Transaction manager for handling blockchain transactions
pub struct TransactionManager {
    signature_manager: SignatureManager,
    rpc_url: String,
}

impl TransactionManager {
    pub fn new(rpc_url: String) -> Self {
        Self {
            signature_manager: SignatureManager::new(),
            rpc_url,
        }
    }

    pub async fn init(&self) -> Result<(), WalletError> {
        log::info!("Initializing transaction manager");
        Ok(())
    }

    pub async fn create_transaction(
        &self,
        to: String,
        value: Amount,
        network: Network,
    ) -> Result<Transaction, WalletError> {
        if to.is_empty() {
            return Err(WalletError::validation("Recipient address cannot be empty"));
        }
        if value.is_empty() {
            return Err(WalletError::validation("Transaction value cannot be empty"));
        }
        Ok(Transaction {
            to,
            value,
            data: None,
            gas_limit: None,
            gas_price: None,
            nonce: None,
            chain_id: network.chain_id(),
        })
    }

    pub async fn sign_transaction(
        &self,
        transaction: &Transaction,
        private_key_id: &str,
        storage: &dyn crate::infrastructure::platform::PlatformStorage,
    ) -> Result<SignedTransaction, WalletError> {
        if private_key_id.is_empty() {
            return Err(WalletError::crypto("Private key ID cannot be empty"));
        }

        // Require nonce, gas price, gas limit for raw signing
        if transaction.nonce.is_none() || transaction.gas_price.is_none() || transaction.gas_limit.is_none() {
            return Err(WalletError::validation("Transaction requires nonce, gas_price, and gas_limit"));
        }

        // Create a SecurePrivateKey reference (does not load key into memory)
        let private_key = crate::core::crypto::keys::SecurePrivateKey::new(private_key_id.to_string());

        // Perform EIP-155 legacy signing and get raw tx bytes and hash
        let (raw_tx, tx_hash) = private_key.with_key(storage, |key_bytes| {
            self.signature_manager.sign_legacy_raw(transaction, key_bytes)
        })?;

        Ok(SignedTransaction {
            transaction: transaction.clone(),
            signature: raw_tx, // signature now carries raw RLP bytes
            hash: tx_hash,
        })
    }

    pub async fn send_transaction(&self, signed_transaction: &SignedTransaction) -> Result<TransactionHash, WalletError> {
        let client = Client::new();
        let tx_hex = format!("0x{}", hex::encode(&signed_transaction.signature));
        let params = json!([tx_hex]);
        let body = json!({
            "jsonrpc": "2.0",
            "method": "eth_sendRawTransaction",
            "params": params,
            "id": 1
        });
        let resp = client.post(&self.rpc_url)
            .json(&body)
            .send()
            .await
            .map_err(|e| WalletError::network(format!("Failed to send transaction: {}", e)))?;
        let resp_json: serde_json::Value = resp.json().await.map_err(|e| WalletError::network(format!("Invalid response: {}", e)))?;
        if let Some(result) = resp_json.get("result") {
            Ok(result.as_str().unwrap_or_default().to_string())
        } else {
            Err(WalletError::network("No transaction hash returned".to_string()))
        }
    }

    pub async fn get_transaction_status(
        &self,
        transaction_hash: &TransactionHash,
    ) -> Result<TransactionStatus, WalletError> {
        if transaction_hash.is_empty() {
            return Err(WalletError::validation("Transaction hash cannot be empty"));
        }
        let client = Client::new();
        let params = json!([transaction_hash]);
        let body = json!({
            "jsonrpc": "2.0",
            "method": "eth_getTransactionReceipt",
            "params": params,
            "id": 1
        });
        let resp = client.post(&self.rpc_url)
            .json(&body)
            .send()
            .await
            .map_err(|e| WalletError::network(format!("Failed to get transaction status: {}", e)))?;
        let resp_json: serde_json::Value = resp.json().await.map_err(|e| WalletError::network(format!("Invalid response: {}", e)))?;
        if resp_json.get("result").is_some() {
            Ok(TransactionStatus::Confirmed)
        } else {
            Ok(TransactionStatus::Pending)
        }
    }

    pub async fn estimate_gas(&self, to_address: &str, amount: u64) -> Result<u64, WalletError> {
        let client = Client::new();
        let params = json!([{ "to": to_address, "value": format!("0x{:x}", amount) }]);
        let body = json!({
            "jsonrpc": "2.0",
            "method": "eth_estimateGas",
            "params": params,
            "id": 1
        });
        let resp = client.post(&self.rpc_url)
            .json(&body)
            .send()
            .await
            .map_err(|e| WalletError::network(format!("Failed to estimate gas: {}", e)))?;
        let resp_json: serde_json::Value = resp.json().await.map_err(|e| WalletError::network(format!("Invalid response: {}", e)))?;
        if let Some(result) = resp_json.get("result") {
            u64::from_str_radix(result.as_str().unwrap_or("0x5208").trim_start_matches("0x"), 16)
                .map_err(|_| WalletError::network("Invalid gas estimate".to_string()))
        } else {
            Ok(21000)
        }
    }

    pub async fn get_gas_price(&self, _network: Network) -> Result<u64, WalletError> {
        let client = Client::new();
        let body = json!({
            "jsonrpc": "2.0",
            "method": "eth_gasPrice",
            "params": [],
            "id": 1
        });
        let resp = client.post(&self.rpc_url)
            .json(&body)
            .send()
            .await
            .map_err(|e| WalletError::network(format!("Failed to get gas price: {}", e)))?;
        let resp_json: serde_json::Value = resp.json().await.map_err(|e| WalletError::network(format!("Invalid response: {}", e)))?;
        if let Some(result) = resp_json.get("result") {
            u64::from_str_radix(result.as_str().unwrap_or("0x4a817c800").trim_start_matches("0x"), 16)
                .map_err(|_| WalletError::network("Invalid gas price".to_string()))
        } else {
            Ok(20000000000)
        }
    }
}

/// Initialize transactions
pub async fn init() -> Result<(), WalletError> {
    log::info!("Initializing transactions");
    Ok(())
}

/// Cleanup transactions
pub async fn cleanup() -> Result<(), WalletError> {
    log::info!("Cleaning up transactions");
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_transactions_init() {
        let result = init().await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_transactions_cleanup() {
        let result = cleanup().await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_transaction_manager() {
        let manager = TransactionManager::new("http://localhost:8545".to_string()); // Mock RPC URL
        manager.init().await
            .expect("Failed to initialize transaction manager");

        let transaction = manager
            .create_transaction(
            "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6".to_string(),
                "1000000000000000000".to_string(),
                Network::CoreTestnet,
            )
            .await
            .expect("Failed to create transaction");

        assert_eq!(transaction.to, "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6");
        assert_eq!(transaction.value, "1000000000000000000");
        assert_eq!(transaction.chain_id, 1114);
    }
} 