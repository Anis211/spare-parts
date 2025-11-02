import ExpandableTreeFromPath from "@/components/tree/Tree";
import { useState, useEffect } from "react";
export default function HomePage() {
  const [tree, setTree] = useState([]);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch(
          "https://api.partsapi.ru/?method=getSearchTree&key=01186691560aa5dbda9f7be1c2dcc7ec&lang=16&carId=9877&carType=PC"
        );
        const data = await res.json();

        setTree(data);
        console.log(data);
      } catch (e) {
        console.error(e.message);
      }
    };
    tree.length == 0 && run();
  }, [setTree]);

  return (
    <div className="px-5">
      <h2>Каталог запчастей</h2>
      <ExpandableTreeFromPath data={tree} />
    </div>
  );
}
