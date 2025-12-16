import React from "react";
import { useSearchParams } from "react-router-dom";
import DomesticNews from "./NewsList";
import GlobalNews from "./GlobalNews";
import "./NewsList.css"; // CSS 파일 공유

function NewsMain() {
  const [params] = useSearchParams();
  const region = params.get("region") || "korea"; // 기본값은 국내

  return (
    <>
      {region === "global" ? <GlobalNews /> : <DomesticNews />}
    </>
  );
}

export default NewsMain;