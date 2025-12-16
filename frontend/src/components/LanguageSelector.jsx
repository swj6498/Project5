import React from "react";
import i18n from "i18next";

export default function LanguageSelector() {
  const changeLang = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <select
      onChange={changeLang}
      defaultValue={i18n.language}
      style={{ padding: "5px", marginBottom: "20px" }}
    >
      <option value="ko">한국어</option>
      <option value="en">English</option>
      <option value="ja">日本語</option>
    </select>
  );
}
