import Document, { Html, Head, Main, NextScript } from "next/document";
import InitColorSchemeScript from "@mui/joy/InitColorSchemeScript";

export default class MyDocument extends Document {
  render() {
    return (
      <Html data-color-scheme="light">
        <Head></Head>
        <body>
          <InitColorSchemeScript />
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
