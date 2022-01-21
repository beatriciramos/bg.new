import Head from "next/head";
import { SubscribeButton } from "../components/SubscribeButton";
import sytles from "./home.module.scss";
export default function Home() {
  return (
    <>
      <Head>
        <title> Home | bg.news </title>{" "}
      </Head>
      <main className={sytles.contentContainer}>
        <section className={sytles.hero}>
          <span> 👏 Hey, welcome</span>
          <h1>
            News about the <span>React</span> world.
          </h1>
          <p>
            Get access to all the publications <br />
            <span>forn$9.90 month</span>
          </p>
          <SubscribeButton />
        </section>
        <img src="/images/avatar.svg" alt="Girl coding" />
      </main>
    </>
  );
}
