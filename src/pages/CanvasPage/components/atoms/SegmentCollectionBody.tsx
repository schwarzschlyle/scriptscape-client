import React from "react";
import CustomCardBody from "../../../../components/CustomCardBody";

interface SegmentCollectionBodyProps {
  editable?: boolean;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const SegmentCollectionBody: React.FC<SegmentCollectionBodyProps> = ({
  editable = false,
  children,
  className,
  style,
  ...rest
}) => (
  <CustomCardBody
    editable={editable}
    className={className}
    style={style}
    {...rest}
  >
    {children}
  </CustomCardBody>
);

export default SegmentCollectionBody;
