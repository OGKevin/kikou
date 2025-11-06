use async_trait::async_trait;

use crate::error::AppError;
use crate::library::models::Book;

#[async_trait]
pub trait BookLibrary: Send + Sync {
    async fn get_all_books(&self) -> Result<Vec<Book>, AppError>;

    async fn get_book(&self, book_id: u32) -> Result<Book, AppError>;

    async fn get_book_count(&self) -> Result<u32, AppError>;

    async fn get_book_cover(&self, book_id: u32) -> Result<Vec<u8>, AppError>;

    fn clone_box(&self) -> Box<dyn BookLibrary>;
}
