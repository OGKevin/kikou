use super::types::{ComicPageType, default_minus_one, is_false, is_minus_one, is_zero_i64};
use serde::Deserialize;

mod comic_page_type_option_serde {
    use super::ComicPageType;
    use serde::{Deserialize, Deserializer};
    use std::str::FromStr;

    pub fn deserialize<'de, D>(deserializer: D) -> Result<Option<ComicPageType>, D::Error>
    where
        D: Deserializer<'de>,
    {
        let opt: Option<String> = Option::deserialize(deserializer)?;
        let s = match opt {
            Some(v) => v,
            None => return Ok(None),
        };

        if s.trim().is_empty() {
            return Ok(None);
        }

        let first = s.split_whitespace().next().unwrap_or("");
        Ok(Some(
            ComicPageType::from_str(first).unwrap_or(ComicPageType::Other),
        ))
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct ComicPageInfo {
    pub double_page: bool,
    pub image: i32,
    pub image_height: i32,
    pub image_size: i64,
    pub image_width: i32,
    pub type_: Option<ComicPageType>,
    pub key: String,
    pub bookmark: String,
}

impl ComicPageInfo {
    #[allow(dead_code)]
    pub fn effective_type(&self) -> ComicPageType {
        self.type_.clone().unwrap_or(ComicPageType::Story)
    }

    pub fn from_page_settings(
        page_type: ComicPageType,
        double_page: bool,
        bookmark: String,
        image: i32,
    ) -> Self {
        Self {
            double_page,
            image,
            image_height: -1,
            image_size: 0,
            image_width: -1,
            type_: match page_type {
                ComicPageType::Other => None,
                t => Some(t),
            },
            key: String::new(),
            bookmark,
        }
    }
}

impl serde::Serialize for ComicPageInfo {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;

        // We construct the struct fields in the desired attribute order.
        let mut state = serializer.serialize_struct("Page", 8)?;

        // Order: Image, Type, DoublePage, ImageSize, Key, Bookmark, ImageWidth, ImageHeight
        state.serialize_field("@Image", &self.image)?;

        if let Some(t) = &self.type_ {
            state.serialize_field("@Type", &t.to_string())?;
        }

        if !is_false(&self.double_page) {
            state.serialize_field("@DoublePage", &self.double_page)?;
        }

        if !is_zero_i64(&self.image_size) {
            state.serialize_field("@ImageSize", &self.image_size)?;
        }

        if !self.key.is_empty() {
            state.serialize_field("@Key", &self.key)?;
        }

        if !self.bookmark.is_empty() {
            state.serialize_field("@Bookmark", &self.bookmark)?;
        }

        if !is_minus_one(&self.image_width) {
            state.serialize_field("@ImageWidth", &self.image_width)?;
        }

        if !is_minus_one(&self.image_height) {
            state.serialize_field("@ImageHeight", &self.image_height)?;
        }

        state.end()
    }
}

impl<'de> serde::Deserialize<'de> for ComicPageInfo {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::de::Deserializer<'de>,
    {
        #[derive(Deserialize)]
        #[serde(rename = "Page", deny_unknown_fields)]
        struct StrictComicPageInfo {
            #[serde(rename = "@DoublePage", default)]
            pub double_page: bool,
            #[serde(rename = "@Image", default)]
            pub image: i32,
            #[serde(rename = "@ImageHeight", default = "default_minus_one")]
            pub image_height: i32,
            #[serde(rename = "@ImageSize", default)]
            pub image_size: i64,
            #[serde(rename = "@ImageWidth", default = "default_minus_one")]
            pub image_width: i32,
            #[serde(rename = "@Type", default, with = "comic_page_type_option_serde")]
            pub type_: Option<ComicPageType>,
            #[serde(rename = "@Key", default)]
            pub key: String,
            #[serde(rename = "@Bookmark", default)]
            pub bookmark: String,
        }

        let strict = StrictComicPageInfo::deserialize(deserializer)?;
        Ok(ComicPageInfo {
            double_page: strict.double_page,
            image: strict.image,
            image_height: strict.image_height,
            image_size: strict.image_size,
            image_width: strict.image_width,
            type_: strict.type_,
            key: strict.key,
            bookmark: strict.bookmark,
        })
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct Pages {
    pub page: Vec<ComicPageInfo>,
}

impl<'de> serde::Deserialize<'de> for Pages {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::de::Deserializer<'de>,
    {
        #[derive(Deserialize)]
        #[serde(rename = "Pages", deny_unknown_fields)]
        struct StrictPages {
            #[serde(rename = "Page", default)]
            pub page: Vec<ComicPageInfo>,
        }

        let strict = StrictPages::deserialize(deserializer)?;
        Ok(Pages { page: strict.page })
    }
}

impl serde::Serialize for Pages {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;

        let mut state = serializer.serialize_struct("Pages", 1)?;
        state.serialize_field("Page", &self.page)?;
        state.end()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use quick_xml::Reader;
    use quick_xml::events::Event;

    #[test]
    fn test_page_attribute_order() {
        let page = ComicPageInfo {
            double_page: true,
            image: 42,
            image_height: 800,
            image_size: 123456,
            image_width: 600,
            type_: Some(ComicPageType::Story),
            key: "k".to_string(),
            bookmark: "b".to_string(),
        };

        let xml = serde_xml_rs::to_string(&page).unwrap();

        let mut reader = Reader::from_str(&xml);
        reader.trim_text(true);
        let mut buf = Vec::new();
        let mut attrs: Vec<String> = Vec::new();

        loop {
            match reader.read_event_into(&mut buf).unwrap() {
                Event::Start(e) | Event::Empty(e) => {
                    for a in e.attributes() {
                        let a = a.unwrap();
                        let key = std::str::from_utf8(a.key.as_ref()).unwrap().to_string();
                        attrs.push(key);
                    }
                    break;
                }
                Event::Eof => break,
                _ => {}
            }
            buf.clear();
        }

        // Fill the expected order below. Example (uncomment and adjust as needed):
        let expected: Vec<String> = vec![
            "Image".to_string(),
            "Type".to_string(),
            "DoublePage".to_string(),
            "ImageSize".to_string(),
            "Key".to_string(),
            "Bookmark".to_string(),
            "ImageWidth".to_string(),
            "ImageHeight".to_string(),
        ];

        assert_eq!(attrs, expected);
    }

    #[test]
    fn test_page_attribute_order_with_missing_fields() {
        let page = ComicPageInfo {
            double_page: false,
            image: 0,
            image_height: -1,
            image_size: 1,
            image_width: 1,
            type_: Some(ComicPageType::Story),
            key: "".to_string(),
            bookmark: "book".to_string(),
        };

        let xml = serde_xml_rs::to_string(&page).unwrap();

        let mut reader = Reader::from_str(&xml);
        reader.trim_text(true);
        let mut buf = Vec::new();
        let mut attrs: Vec<String> = Vec::new();

        loop {
            match reader.read_event_into(&mut buf).unwrap() {
                Event::Start(e) | Event::Empty(e) => {
                    for a in e.attributes() {
                        let a = a.unwrap();
                        let key = std::str::from_utf8(a.key.as_ref()).unwrap().to_string();
                        attrs.push(key);
                    }
                    break;
                }
                Event::Eof => break,
                _ => {}
            }
            buf.clear();
        }

        // Fill the expected order below. Example (uncomment and adjust as needed):
        let expected: Vec<String> = vec![
            "Image".to_string(),
            "Type".to_string(),
            "ImageSize".to_string(),
            "Bookmark".to_string(),
            "ImageWidth".to_string(),
        ];

        assert_eq!(attrs, expected);
    }
}
