use std::fs::{self, File};
use std::io::{self, Write};
use zip::{ZipWriter, write::FileOptions};

fn main() -> io::Result<()> {
    let output_path = "../tmp/test_invalid_comic.cbz";
    let reference_image_path = "../tmp/image.png";

    println!("Creating test CBZ file with invalid ComicInfo.xml...");

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
    let temp_dir = "temp_cbz_creation";
    fs::create_dir_all(temp_dir)?;

    // Create image files using the reference image
    let image_files = ["00_cover.png", "01_page.png", "02_page.png", "03_page.png"];

    // Copy the reference image to all our test image files
    let reference_content = fs::read(reference_image_path)?;
    for image_file in &image_files {
        let image_path = format!("{}/{}", temp_dir, image_file);
        fs::write(&image_path, &reference_content)?;
    }

    // Create invalid ComicInfo.xml with various issues
    let invalid_xml_content = r#"<?xml version="1.0" encoding="UTF-8"?>
<ComicInfo xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
           xmlns:xsd="http://www.w3.org/2001/XMLSchema">
    <Title>Test Comic with Invalid XML</Title>
    <Series>Test Series</Series>
    <Number>1</Number>
    <Count>INVALID_NUMBER</Count>  <!-- Invalid: should be integer -->
    <Volume>-5</Volume>            <!-- Invalid: negative volume -->
    <Summary>This is a test comic created to test invalid ComicInfo.xml handling.</Summary>
    <Year>2025</Year>
    <Month>13</Month>              <!-- Invalid: month > 12 -->
    <Day>32</Day>                  <!-- Invalid: day > 31 -->
    <Writer>Test Author</Writer>
    <Penciller>Test Artist</Penciller>
    <Publisher>Test Publisher</Publisher>
    <Genre>Action, Adventure</Genre>
    <Web>https://example.com</Web>
    <PageCount>INVALID</PageCount> <!-- Invalid: should be integer -->
    <LanguageISO>EN</LanguageISO>
    <Format>Series</Format>
    <BlackAndWhite>MAYBE</BlackAndWhite> <!-- Invalid: should be Yes/No -->
    <Manga>UNKNOWN</Manga>        <!-- Invalid: should be Yes/No -->
    <CommunityRating>6.5</CommunityRating> <!-- Invalid: should be 1-5 -->
    <Pages>
        <Page Image="0" Type="FrontCover" />
        <Page Image="1" Type="Story" />
        <Page Image="2" Type="INVALID_TYPE" /> <!-- Invalid page type -->
        <Page Image="3" Type="Story" />
    </Pages>
    <!-- Unclosed tag to make XML malformed -->
    <UnclosedTag>This tag is never closed
</ComicInfo>"#;

    let xml_path = format!("{}/ComicInfo.xml", temp_dir);
    fs::write(&xml_path, invalid_xml_content)?;

    // Create the CBZ file
    let file = File::create(output_path)?;
    let mut zip = ZipWriter::new(file);

    let options = FileOptions::<()>::default().compression_method(zip::CompressionMethod::Stored);

    // Add image files to zip
    for image_file in &image_files {
        let file_path = format!("{}/{}", temp_dir, image_file);
        let file_content = fs::read(&file_path)?;
        zip.start_file(*image_file, options)?;
        zip.write_all(&file_content)?;
    }

    // Add the invalid ComicInfo.xml to zip
    zip.start_file("ComicInfo.xml", options)?;
    zip.write_all(invalid_xml_content.as_bytes())?;

    zip.finish()?;

    // Clean up temporary files
    fs::remove_dir_all(temp_dir)?;

    println!("✅ Created test CBZ file: {}", output_path);
    println!("This CBZ contains:");
    println!("  - {} dummy image files", image_files.len());
    println!("  - Invalid ComicInfo.xml with multiple validation errors:");
    println!("    • Invalid Count field (non-numeric)");
    println!("    • Negative Volume");
    println!("    • Invalid Month (13)");
    println!("    • Invalid Day (32)");
    println!("    • Invalid PageCount (non-numeric)");
    println!("    • Invalid boolean fields");
    println!("    • Invalid CommunityRating (out of range)");
    println!("    • Invalid page type");
    println!("    • Malformed XML (unclosed tag)");
    println!();
    println!("Use this file to test the error handling flow in your application!");

    Ok(())
}
