import "@/styles/globals.css";
import "@/styles/animations.css";
import Layout from "./layout";
import { EdgeStoreProvider } from "@/lib/edgestore";

export default function App({ Component, pageProps: { ...pageProps } }) {
  return (
    <EdgeStoreProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </EdgeStoreProvider>
  );
}
