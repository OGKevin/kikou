use super::types::{Archive, ArchiveFile, ReadArchiveError};
use crate::comicinfo::ComicInfo;
use rayon::prelude::*;
use std::io::Read;
use std::sync::Arc;

fn open_zip_archive(path: &str) -> Result<zip::ZipArchive<std::fs::File>, ReadArchiveError> {
    let file = std::fs::File::open(path).map_err(ReadArchiveError::Io)?;
    let archive = zip::ZipArchive::new(file).map_err(ReadArchiveError::Zip)?;
    Ok(archive)
}

pub fn read_archive(path: &str) -> Result<Archive, ReadArchiveError> {
    let mut archive = open_zip_archive(path)?;

    let mut files = Vec::new();
    let mut comic_info = None;

    for i in 0..archive.len() {
        let zip_file = archive.by_index(i).map_err(ReadArchiveError::Zip)?;
        let name = zip_file.name().to_string();
        files.push(ArchiveFile { name });
    }

    if let Ok(mut comic_info_file) = archive.by_name("ComicInfo.xml") {
        let mut xml_content = String::new();
        comic_info_file
            .read_to_string(&mut xml_content)
            .map_err(ReadArchiveError::Io)?;
        match ComicInfo::parse(&xml_content) {
            Ok(parsed_comic_info) => {
                comic_info = Some(parsed_comic_info);
            }
            Err(e) => {
                return Err(ReadArchiveError::FailedToParseComicInfoXml(e));
            }
        }
    }

    Ok(Archive { files, comic_info })
}

pub fn get_file_data(path: &str, file_name: &str) -> Result<Vec<u8>, ReadArchiveError> {
    let mut archive = open_zip_archive(path)?;

    let mut zip_file = archive.by_name(file_name).map_err(ReadArchiveError::Zip)?;
    let mut data = Vec::new();
    zip_file
        .read_to_end(&mut data)
        .map_err(ReadArchiveError::Io)?;
    Ok(data)
}

pub fn stream_file_data_from_archive(
    path: &str,
    file_names: Vec<String>,
    on_data: impl Fn(String, Vec<u8>) + Send + Sync + 'static,
    on_error: impl Fn(String, String) + Send + Sync + 'static,
) -> Result<(), ReadArchiveError> {
    let _ = open_zip_archive(path)?;

    let on_data = Arc::new(on_data);
    let on_error = Arc::new(on_error);
    let path = Arc::new(path.to_string());

    file_names
        .par_iter()
        .for_each(|file_name| match open_zip_archive(&path) {
            Ok(mut archive) => match archive.by_name(file_name) {
                Ok(mut zip_file) => {
                    let mut data = Vec::new();
                    if let Err(e) = zip_file.read_to_end(&mut data) {
                        on_error(file_name.clone(), e.to_string());
                        return;
                    }

                    on_data(file_name.clone(), data);
                }
                Err(e) => {
                    on_error(file_name.clone(), e.to_string());
                }
            },
            Err(e) => {
                on_error(file_name.clone(), e.to_string());
            }
        });

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;
    use std::sync::{Arc, Mutex};
    use zip::ZipWriter;
    use zip::write::FileOptions;

    struct TestArchive {
        _temp_file: tempfile::NamedTempFile,
        path: String,
    }

    impl TestArchive {
        fn new(files: Vec<(&str, &[u8])>) -> Self {
            let temp_file = tempfile::NamedTempFile::new().unwrap();
            let path = temp_file.path().to_str().unwrap().to_string();

            let file = temp_file.reopen().unwrap();
            let mut zip = ZipWriter::new(file);

            for (name, content) in files {
                let options =
                    FileOptions::default().compression_method(zip::CompressionMethod::Stored);
                zip.start_file(name, options).unwrap();
                zip.write_all(content).unwrap();
            }

            zip.finish().unwrap();

            TestArchive {
                _temp_file: temp_file,
                path,
            }
        }

        fn path(&self) -> &str {
            &self.path
        }
    }

    #[test]
    fn test_stream_file_data_success() {
        let archive =
            TestArchive::new(vec![("file1.txt", b"content1"), ("file2.txt", b"content2")]);

        let data_calls = Arc::new(Mutex::new(Vec::new()));
        let error_calls = Arc::new(Mutex::new(Vec::new()));

        let data_calls_clone = data_calls.clone();
        let error_calls_clone = error_calls.clone();

        let on_data = move |file_name: String, data: Vec<u8>| {
            data_calls_clone.lock().unwrap().push((file_name, data));
        };

        let on_error = move |file_name: String, error: String| {
            error_calls_clone.lock().unwrap().push((file_name, error));
        };

        let result = stream_file_data_from_archive(
            archive.path(),
            vec!["file1.txt".to_string(), "file2.txt".to_string()],
            on_data,
            on_error,
        );

        assert!(
            result.is_ok(),
            "Expected Ok result from streaming file data, but got Err {:?}",
            result
        );

        let data_calls_guard = data_calls.lock().unwrap();
        let error_calls_guard = error_calls.lock().unwrap();

        assert_eq!(data_calls_guard.len(), 2);
        assert_eq!(error_calls_guard.len(), 0);

        // Sort by filename for deterministic testing (parallel execution order is not guaranteed)
        let mut calls = data_calls_guard.clone();
        calls.sort_by(|a, b| a.0.cmp(&b.0));

        assert_eq!(calls[0].0, "file1.txt");
        assert_eq!(calls[0].1, b"content1");
        assert_eq!(calls[1].0, "file2.txt");
        assert_eq!(calls[1].1, b"content2");
    }

    #[test]
    fn test_stream_file_data_missing_file() {
        let archive = TestArchive::new(vec![("file1.txt", b"content1")]);

        let data_calls = Arc::new(Mutex::new(Vec::new()));
        let error_calls = Arc::new(Mutex::new(Vec::new()));

        let data_calls_clone = data_calls.clone();
        let error_calls_clone = error_calls.clone();

        let on_data = move |file_name: String, data: Vec<u8>| {
            data_calls_clone.lock().unwrap().push((file_name, data));
        };

        let on_error = move |file_name: String, error: String| {
            error_calls_clone.lock().unwrap().push((file_name, error));
        };

        let result = stream_file_data_from_archive(
            archive.path(),
            vec!["nonexistent.txt".to_string()],
            on_data,
            on_error,
        );

        assert!(result.is_ok());
        assert_eq!(data_calls.lock().unwrap().len(), 0);
        assert_eq!(error_calls.lock().unwrap().len(), 1);
    }

    #[test]
    fn test_stream_file_data_empty_list() {
        let archive = TestArchive::new(vec![("file1.txt", b"content1")]);

        let data_calls = Arc::new(Mutex::new(Vec::new()));
        let error_calls = Arc::new(Mutex::new(Vec::new()));

        let data_calls_clone = data_calls.clone();
        let error_calls_clone = error_calls.clone();

        let on_data = move |file_name: String, data: Vec<u8>| {
            data_calls_clone.lock().unwrap().push((file_name, data));
        };

        let on_error = move |file_name: String, error: String| {
            error_calls_clone.lock().unwrap().push((file_name, error));
        };

        let result = stream_file_data_from_archive(archive.path(), vec![], on_data, on_error);

        assert!(result.is_ok());
        assert_eq!(data_calls.lock().unwrap().len(), 0);
        assert_eq!(error_calls.lock().unwrap().len(), 0);
    }

    #[test]
    fn test_stream_file_data_invalid_archive() {
        let on_data = |_: String, _: Vec<u8>| {};
        let on_error = |_: String, _: String| {};

        let result = stream_file_data_from_archive(
            "nonexistent_archive.zip",
            vec!["file.txt".to_string()],
            on_data,
            on_error,
        );

        assert!(result.is_err());
    }
}
