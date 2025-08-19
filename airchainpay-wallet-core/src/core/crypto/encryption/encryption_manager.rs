use crate::shared::error::WalletError;
use crate::shared::WalletResult;
use aes_gcm::{Aes256Gcm, KeyInit, Key, Nonce};
use aes_gcm::aead::Aead;
use chacha20poly1305::{ChaCha20Poly1305, Key as ChaChaKey, Nonce as ChaChaNonce};
use rand_core::OsRng;
use rand_core::RngCore;
use super::{EncryptionAlgorithm, EncryptedData};

/// Secure encryption manager
pub struct EncryptionManager {
    algorithm: EncryptionAlgorithm,
}

impl EncryptionManager {
    pub fn new(algorithm: EncryptionAlgorithm) -> Self {
        Self { algorithm }
    }

    pub fn new_default() -> Self {
        Self::new(EncryptionAlgorithm::AES256GCM)
    }

    /// Encrypt data with a key
    pub fn encrypt(&self, data: &[u8], key: &[u8]) -> WalletResult<EncryptedData> {
        match self.algorithm {
            EncryptionAlgorithm::AES256GCM => self.encrypt_aes_gcm(data, key),
            EncryptionAlgorithm::ChaCha20Poly1305 => self.encrypt_chacha20(data, key),
        }
    }

    /// Decrypt data with a key
    pub fn decrypt(&self, encrypted_data: &EncryptedData, key: &[u8]) -> WalletResult<Vec<u8>> {
        match encrypted_data.algorithm {
            EncryptionAlgorithm::AES256GCM => self.decrypt_aes_gcm(encrypted_data, key),
            EncryptionAlgorithm::ChaCha20Poly1305 => self.decrypt_chacha20(encrypted_data, key),
        }
    }

    /// Encrypt using AES-256-GCM
    fn encrypt_aes_gcm(&self, data: &[u8], key: &[u8]) -> WalletResult<EncryptedData> {
        if key.len() != 32 {
            return Err(WalletError::Crypto("AES-256-GCM requires 32-byte key".to_string()));
        }

        let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(key));
        let nonce_bytes = self.generate_nonce(12);
        let nonce = Nonce::from_slice(&nonce_bytes);

        let ciphertext = cipher
            .encrypt(nonce, data)
            .map_err(|e| WalletError::Crypto(format!("AES-GCM encryption failed: {}", e)))?;

        // Split ciphertext and tag
        let (ciphertext_part, tag) = ciphertext.split_at(ciphertext.len() - 16);

        Ok(EncryptedData {
            algorithm: EncryptionAlgorithm::AES256GCM,
            ciphertext: ciphertext_part.to_vec(),
            nonce: nonce_bytes,
            tag: tag.to_vec(),
        })
    }

    /// Decrypt using AES-256-GCM
    fn decrypt_aes_gcm(&self, encrypted_data: &EncryptedData, key: &[u8]) -> WalletResult<Vec<u8>> {
        if key.len() != 32 {
            return Err(WalletError::Crypto("AES-256-GCM requires 32-byte key".to_string()));
        }

        let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(key));
        let nonce = Nonce::from_slice(&encrypted_data.nonce);

        // Combine ciphertext and tag
        let mut ciphertext_with_tag = encrypted_data.ciphertext.clone();
        ciphertext_with_tag.extend_from_slice(&encrypted_data.tag);

        let plaintext = cipher
            .decrypt(nonce, ciphertext_with_tag.as_slice())
            .map_err(|e| WalletError::Crypto(format!("AES-GCM decryption failed: {}", e)))?;

        Ok(plaintext)
    }

    /// Encrypt using ChaCha20-Poly1305
    fn encrypt_chacha20(&self, data: &[u8], key: &[u8]) -> WalletResult<EncryptedData> {
        if key.len() != 32 {
            return Err(WalletError::Crypto("ChaCha20-Poly1305 requires 32-byte key".to_string()));
        }

        let cipher = ChaCha20Poly1305::new(ChaChaKey::from_slice(key));
        let nonce_bytes = self.generate_nonce(12);
        let nonce = ChaChaNonce::from_slice(&nonce_bytes);

        let ciphertext = cipher
            .encrypt(nonce, data)
            .map_err(|e| WalletError::Crypto(format!("ChaCha20-Poly1305 encryption failed: {}", e)))?;

        // Split ciphertext and tag
        let (ciphertext_part, tag) = ciphertext.split_at(ciphertext.len() - 16);

        Ok(EncryptedData {
            algorithm: EncryptionAlgorithm::ChaCha20Poly1305,
            ciphertext: ciphertext_part.to_vec(),
            nonce: nonce_bytes,
            tag: tag.to_vec(),
        })
    }

    /// Decrypt using ChaCha20-Poly1305
    fn decrypt_chacha20(&self, encrypted_data: &EncryptedData, key: &[u8]) -> WalletResult<Vec<u8>> {
        if key.len() != 32 {
            return Err(WalletError::Crypto("ChaCha20-Poly1305 requires 32-byte key".to_string()));
        }

        let cipher = ChaCha20Poly1305::new(ChaChaKey::from_slice(key));
        let nonce = ChaChaNonce::from_slice(&encrypted_data.nonce);

        // Combine ciphertext and tag
        let mut ciphertext_with_tag = encrypted_data.ciphertext.clone();
        ciphertext_with_tag.extend_from_slice(&encrypted_data.tag);

        let plaintext = cipher
            .decrypt(nonce, ciphertext_with_tag.as_slice())
            .map_err(|e| WalletError::Crypto(format!("ChaCha20-Poly1305 decryption failed: {}", e)))?;

        Ok(plaintext)
    }

    /// Generate a secure random nonce
    fn generate_nonce(&self, length: usize) -> Vec<u8> {
        let mut nonce = vec![0u8; length];
        let mut rng = OsRng;
        rng.fill_bytes(&mut nonce);
        nonce
    }

    /// Generate a random encryption key
    pub fn generate_key(&self) -> Vec<u8> {
        let mut key = vec![0u8; 32];
        let mut rng = OsRng;
        rng.fill_bytes(&mut key);
        key
    }
}

impl Drop for EncryptionManager {
    fn drop(&mut self) {
        // Clear any sensitive data
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encryption_manager_new() {
        let _manager = EncryptionManager::new(EncryptionAlgorithm::AES256GCM);
        assert!(true); // Manager created successfully
    }

    #[test]
    fn test_encrypt_decrypt_data() {
        let manager = EncryptionManager::new(EncryptionAlgorithm::AES256GCM);
        let data = b"Hello, World!";
        let key = [0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f, 0x20];
        
        let encrypted = manager.encrypt(data, &key)
            .expect("Failed to encrypt data");
        assert_ne!(data, encrypted.ciphertext.as_slice());
        
        let decrypted = manager.decrypt(&encrypted, &key)
            .expect("Failed to decrypt data");
        assert_eq!(data, decrypted.as_slice());
    }

    #[test]
    fn test_encrypt_decrypt_with_wrong_key() {
        let manager = EncryptionManager::new(EncryptionAlgorithm::AES256GCM);
        let data = b"Hello, World!";
        let key = [0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f, 0x20];
        let wrong_key = [0xff, 0xfe, 0xfd, 0xfc, 0xfb, 0xfa, 0xf9, 0xf8, 0xf7, 0xf6, 0xf5, 0xf4, 0xf3, 0xf2, 0xf1, 0xf0, 0xef, 0xee, 0xed, 0xec, 0xeb, 0xea, 0xe9, 0xe8, 0xe7, 0xe6, 0xe5, 0xe4, 0xe3, 0xe2, 0xe1, 0xe0];
        
        let encrypted = manager.encrypt(data, &key)
            .expect("Failed to encrypt data");
        let result = manager.decrypt(&encrypted, &wrong_key);
        assert!(result.is_err());
    }

    #[test]
    fn test_encrypt_empty_data() {
        let manager = EncryptionManager::new(EncryptionAlgorithm::AES256GCM);
        let data = b"";
        let key = [0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f, 0x20];
        
        let encrypted = manager.encrypt(data, &key)
            .expect("Failed to encrypt empty data");
        let decrypted = manager.decrypt(&encrypted, &key)
            .expect("Failed to decrypt empty data");
        assert_eq!(data, decrypted.as_slice());
    }

    #[test]
    fn test_encrypt_large_data() {
        let manager = EncryptionManager::new(EncryptionAlgorithm::AES256GCM);
        let data = b"x".repeat(1000);
        let key = [0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f, 0x20];
        
        let encrypted = manager.encrypt(&data, &key)
            .expect("Failed to encrypt large data");
        let decrypted = manager.decrypt(&encrypted, &key)
            .expect("Failed to decrypt large data");
        assert_eq!(data, decrypted.as_slice());
    }
} 