/* eslint-disable jsx-a11y/alt-text */
"use client";

import { withBasePath } from "@/lib/utils/basePath";
import Image from "next/image";
import { useEffect, useState } from "react";

const ImageFallback = (props: any) => {
  const { src, fallback, ...rest } = props;
  const [imgSrc, setImgSrc] = useState(src);

  useEffect(() => {
    setImgSrc(src);
  }, [src]);

  return (
    <Image
      {...rest}
      src={typeof imgSrc === "string" ? withBasePath(imgSrc) : imgSrc}
      onError={() => {
        setImgSrc(fallback);
      }}
    />
  );
};

export default ImageFallback;
