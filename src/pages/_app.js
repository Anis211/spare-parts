import "@/styles/globals.css";
import "@/styles/animations.css";
import Layout from "./layout";

export default function App({ Component, pageProps: { ...pageProps } }) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
