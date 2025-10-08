pub mod commands;
pub mod info;
pub mod page;
pub mod types;

pub use info::{ComicInfo, get_bookmarked_pages};
pub use page::{ComicPageInfo, Pages};
pub use types::ComicPageType;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_minimal() {
        let xml = r#"<?xml version="1.0" encoding="utf-8"?>
<ComicInfo>
</ComicInfo>"#;
        let comic = ComicInfo::parse(xml).unwrap();
        assert_eq!(comic.title, None);
        assert_eq!(comic.count, -1);
        assert_eq!(comic.black_and_white, types::YesNo::Unknown);
    }

    #[test]
    fn test_parse_minimal_page() {
        let xml = r#"<?xml version="1.0" encoding="utf-8"?>
<ComicInfo>
  <Pages>
    <Pagee />
  </Pages>
</ComicInfo>"#;
        let comic = ComicInfo::parse(xml);
        assert!(comic.is_err());
    }

    #[test]
    fn test_parse_yes_no() {
        let xml = r#"<?xml version="1.0" encoding="utf-8"?>
<ComicInfo>
    <BlackAndWhite>Yes</BlackAndWhite>
    <Manga>No</Manga>
</ComicInfo>"#;
        let comic = ComicInfo::parse(xml).unwrap();
        assert_eq!(comic.black_and_white, types::YesNo::Yes);
        assert_eq!(comic.manga, types::Manga::No);
    }

    #[test]
    fn test_parse_ligngering_bracked() {
        let xml = r#"<?xml version="1.0" encoding="utf-8"?>
<ComicInfo>
    <Manga>No</Manga>
</ComicInfo>>"#;
        let comic = ComicInfo::parse(xml);
        assert!(comic.is_err());
    }

    #[test]
    fn test_parse_empty() {
        let xml = "";
        let comic = ComicInfo::parse(xml);
        assert!(comic.is_err());
    }

    #[test]
    fn test_parse_full() {
        let xml = r#"<?xml version="1.0"?>
<ComicInfo xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema"> 
  <Title>AKB49, Vol. 1</Title>
  <Series>AKB49: The Rules Against Love</Series>
  <Number>1.0</Number>
  <Summary>**A boy joins AKB48!?  
** One boy in a garden of girls. Heart-pounding to the limit! If he's found out—it's hell!? 
High school student **Minoru Urayama** hears that his beloved classmate, **Hiroko Yoshinaga** , is auditioning for AKB48. To support her, he disguises himself as a girl, takes the name **Minori Urakawa** , and sneaks into the audition.
Thanks to his efforts, Hiroko passes with flying colors—but incredibly, **"Minori Urakawa" is also accepted**!!
A secret double life begins—one he can't tell anyone about!
</Summary>
  <Year>2010</Year>
  <Month>12</Month>
  <Day>17</Day>
  <Writer>Reiji Miyajima, Motoazabu Factory, Hisashi Takahashi</Writer>
  <Publisher>Kodansha</Publisher>
  <Tags>Archive, Comedy, Comics &amp; Graphic Novels, Manga, Romance</Tags>
  <PageCount>195</PageCount>
  <LanguageISO>ja</LanguageISO>
  <Pages>
    <Page Image="0" Type="FrontCover" Bookmark="Cover" />
    <Page Image="1" Type="Other" DoublePage="true" />
    <Page Image="2" Type="InnerCover" />
    <Page Image="5" Type="Story" DoublePage="true" />
    <Page Image="7" Type="Story" Bookmark="Chapter 1: God's Recommendation" />
    <Page Image="14" Type="Story" DoublePage="true" />
    <Page Image="27" Type="Story" DoublePage="true" />
    <Page Image="30" Type="Story" DoublePage="true" />
    <Page Image="69" Type="Story" Bookmark="Chapter 2: The Sparkling Star is.." />
    <Page Image="75" Type="Story" DoublePage="true" />
    <Page Image="94" Type="Story" DoublePage="true" />
    <Page Image="102" Type="Story" Bookmark="Chapter 3: 100x100" />
    <Page Image="123" Type="Story" DoublePage="true" />
    <Page Image="132" Type="Story" Bookmark="Chapter 4: God's Drink" />
    <Page Image="132" Type="Story" Bookmark="Chapter 5: The Hydrangeas's Color is.." />
    <Page Image="174" Type="Story" Bookmark="Chapter 6: The Sun" />
    <Page Image="193" Type="Letters" />
    <Page Image="194" Type="BackCover" />
  </Pages>
</ComicInfo>"#;
        let comic = ComicInfo::parse(xml).unwrap();
        assert_eq!(comic.title, Some("AKB49, Vol. 1".to_string()));
        assert_eq!(
            comic.series,
            Some("AKB49: The Rules Against Love".to_string())
        );
        assert_eq!(comic.number, Some("1.0".to_string()));
        assert_eq!(
            comic
                .summary
                .as_ref()
                .unwrap()
                .contains("A boy joins AKB48"),
            true
        );
        assert_eq!(comic.year, 2010);
        assert_eq!(comic.month, 12);
        assert_eq!(comic.day, 17);
        assert_eq!(
            comic.writer,
            Some("Reiji Miyajima, Motoazabu Factory, Hisashi Takahashi".to_string())
        );
        assert_eq!(comic.publisher, Some("Kodansha".to_string()));
        assert_eq!(
            comic.tags,
            Some("Archive, Comedy, Comics & Graphic Novels, Manga, Romance".to_string())
        );
        assert_eq!(comic.page_count, 195);
        assert_eq!(comic.language_iso, Some("ja".to_string()));
        assert!(comic.pages.is_some());
        let pages = &comic.pages.as_ref().unwrap().page;
        assert_eq!(pages.len(), 18);
        assert_eq!(pages[0].image, 0);
        assert_eq!(pages[0].type_, Some(ComicPageType::FrontCover));
        assert_eq!(pages[0].bookmark, "Cover".to_string());
        assert_eq!(pages[1].image, 1);
        assert_eq!(pages[1].type_, Some(ComicPageType::Other));
        assert_eq!(pages[1].double_page, true);
        assert_eq!(pages[4].image, 7);
        assert_eq!(
            pages[4].bookmark,
            "Chapter 1: God's Recommendation".to_string()
        );
    }

    #[test]
    fn test_to_xml() {
        let mut comic = ComicInfo::default();
        comic.title = Some("Test".to_string());
        comic.count = 5;
        let xml = comic.to_xml().unwrap();
        assert!(xml.contains("<Title>Test</Title>"));
        assert!(xml.contains("<Count>5</Count>"));
        assert!(xml.starts_with("<?xml"));
    }

    #[test]
    fn test_round_trip() {
        let original_xml = r#"<?xml version="1.0" encoding="utf-8"?>
<ComicInfo>
  <Title>Round Trip</Title>
  <Count>2</Count>
  <Pages>
    <Page Image="0" Type="FrontCover" />
  </Pages>
</ComicInfo>"#;
        let comic = ComicInfo::parse(original_xml).unwrap();
        let output_xml = comic.to_xml().unwrap();
        let reparsed = ComicInfo::parse(&output_xml).unwrap();
        assert_eq!(comic, reparsed);
    }

    #[test]
    fn test_empty_default_type() {
        let original_xml = r#"<?xml version="1.0" encoding="utf-8"?>
<ComicInfo>
  <Title>Round Trip</Title>
  <Count>2</Count>
  <Pages>
    <Page Image="0" />
  </Pages>
</ComicInfo>"#;
        let comic = ComicInfo::parse(original_xml).unwrap();
        let output_xml = comic.to_xml().unwrap();
        let reparsed = ComicInfo::parse(&output_xml).unwrap();
        assert_eq!(comic, reparsed);
    }

    #[test]
    fn test_parse_with_multiple_types() {
        let xml = r#"<?xml version="1.0" encoding="utf-8"?>
<ComicInfo>
  <Pages>
    <Page Image="0" Type="FrontCover Story" />
  </Pages>
</ComicInfo>"#;
        let comic = ComicInfo::parse(xml).unwrap();
        let pages = &comic.pages.as_ref().unwrap().page;
        assert_eq!(pages[0].type_, Some(ComicPageType::FrontCover));
    }

    #[test]
    fn test_serialize_multiple_types() {
        let mut comic = ComicInfo::default();
        comic.pages = Some(Pages {
            page: vec![ComicPageInfo {
                image: 0,
                type_: Some(ComicPageType::FrontCover),
                double_page: false,
                image_size: 0,
                key: "".to_string(),
                bookmark: "".to_string(),
                image_width: -1,
                image_height: -1,
            }],
        });
        let xml = comic.to_xml().unwrap();
        assert!(xml.contains("Type=\"FrontCover\""));
    }

    #[test]
    fn test_get_bookmarked_pages() {
        let image_files = vec!["page001.jpg".to_string(), "page002.jpg".to_string()];

        let mut comic = ComicInfo::default();
        comic.pages = Some(Pages {
            page: vec![
                ComicPageInfo {
                    image: 0,
                    bookmark: "Chapter 1".to_string(),
                    type_: Some(ComicPageType::Story),
                    double_page: false,
                    image_size: 0,
                    key: "".to_string(),
                    image_width: -1,
                    image_height: -1,
                },
                ComicPageInfo {
                    image: 1,
                    bookmark: "".to_string(),
                    type_: Some(ComicPageType::Story),
                    double_page: false,
                    image_size: 0,
                    key: "".to_string(),
                    image_width: -1,
                    image_height: -1,
                },
            ],
        });

        let bookmarked = get_bookmarked_pages(&comic, &image_files);
        assert_eq!(bookmarked.len(), 1);
        assert_eq!(bookmarked[0], "page001.jpg");
    }
}
