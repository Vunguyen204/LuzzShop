import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUp } from "@fortawesome/free-solid-svg-icons";
import "./style.scss";

function ScrollTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const toggleVisible = () => {
      setVisible(window.scrollY > 300);
    };

    window.addEventListener("scroll", toggleVisible);

    return () => {
      window.removeEventListener("scroll", toggleVisible);
    };
  }, []);

  const scrollToTop = () => {
    const scrollStep = -window.scrollY / 50;

    const scrollInterval = setInterval(() => {
      if (window.scrollY !== 0) {
        window.scrollBy(0, scrollStep);
      } else {
        clearInterval(scrollInterval);
      }
    }, 10);
  };

  return (
    visible && (
      <button className="scroll-top-btn" onClick={scrollToTop}>
        <FontAwesomeIcon icon={faArrowUp} />
      </button>
    )
  );
}

export default ScrollTopButton;
