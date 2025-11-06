#[cfg(test)]
mod tests {
    use app_lib::error::AppError;

    #[test]
    fn test_app_error_creation() {
        let err = AppError::LibraryError("test error".to_string());
        assert!(matches!(err, AppError::LibraryError(_)));
    }

    #[test]
    fn test_app_error_display() {
        let err = AppError::BookNotFound("book 123".to_string());
        let msg = format!("{}", err);
        assert!(msg.contains("book 123"));
    }

    #[test]
    fn test_app_error_variants() {
        let errors = [
            AppError::LibraryError("lib error".to_string()),
            AppError::BookNotFound("not found".to_string()),
            AppError::DatabaseError("db error".to_string()),
            AppError::IoError("io error".to_string()),
            AppError::ValidationError("validation error".to_string()),
        ];

        assert_eq!(errors.len(), 5);
    }
}
