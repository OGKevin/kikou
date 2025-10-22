use std::fs::{self, File};
use std::io::{self, Write};
use zip::{ZipWriter, write::FileOptions};

fn main() -> io::Result<()> {
    let output_path = "../tmp/test_missing_comicinfo.cbz";
    let reference_image_path = "../tmp/image.png";

    println!("Creating test CBZ file with missing ComicInfo.xml...");

    // Check if reference image exists
    if !std::path::Path::new(reference_image_path).exists() {
        eprintln!(
            "❌ Error: Reference image not found at {}",
            reference_image_path
        );
        eprintln!("Please create this image file first. You can:");
        eprintln!("  1. Copy any PNG image to ../tmp/image.png");
        eprintln!("  2. Or create a simple test image using any image editor");
        eprintln!("  3. Or use an existing image from the ../tmp/unzip/ directory");
        std::process::exit(1);
    }

    println!("✅ Using reference image: {}", reference_image_path);

    // Create a temporary directory for our test files
    let temp_dir = "temp_cbz_creation_missing";
    fs::create_dir_all(temp_dir)?;

    // Create image files using the reference image (5 copies as requested)
    let image_files = [
        "00_cover.png",
        "01_page.png",
        "02_page.png",
        "03_page.png",
        "04_page.png",
    ];

    // Copy the reference image to all our test image files
    let reference_content = fs::read(reference_image_path)?;
    for image_file in &image_files {
        let image_path = format!("{}/{}", temp_dir, image_file);
        fs::write(&image_path, &reference_content)?;
    }

    // Note: We intentionally DO NOT create ComicInfo.xml

    // Create the CBZ file
    let file = File::create(output_path)?;
    let mut zip = ZipWriter::new(file);

    let options = FileOptions::<()>::default().compression_method(zip::CompressionMethod::Stored);

    // Add only image files to zip (no ComicInfo.xml)
    for image_file in &image_files {
        let file_path = format!("{}/{}", temp_dir, image_file);
        let file_content = fs::read(&file_path)?;
        zip.start_file(*image_file, options)?;
        zip.write_all(&file_content)?;
    }

    zip.finish()?;

    // Clean up temporary files
    fs::remove_dir_all(temp_dir)?;

    println!("✅ Created test CBZ file: {}", output_path);
    println!("This CBZ contains:");
    println!("  - {} dummy image files", image_files.len());
    println!("  - NO ComicInfo.xml file (missing entirely)");
    println!();
    println!("Use this file to test the missing ComicInfo.xml flow!");
    println!(
        "This should trigger the 'FailedToParseComicInfoXml' error and redirect to XML editor."
    );

    Ok(())
}
