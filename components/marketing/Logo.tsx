export function Logo() {
  return (
    <span className="logo-mark">
      <span className="glow" />
      <svg viewBox="0 0 100 130">
        <line className="col col-l-abacus" x1="5" y1="14" x2="27" y2="14" strokeWidth="2.2" />
        <line className="col col-l-echinus" x1="9" y1="18" x2="23" y2="18" strokeWidth="1.4" />
        <line className="col col-l-shaft" x1="16" y1="20" x2="16" y2="108" strokeWidth="3.6" />
        <line className="col fluting" x1="13" y1="24" x2="13" y2="104" strokeWidth="0.6" />
        <line className="col fluting" x1="19" y1="24" x2="19" y2="104" strokeWidth="0.6" />
        <line className="col col-l-base1" x1="9" y1="110" x2="23" y2="110" strokeWidth="1.4" />
        <line className="col col-l-base2" x1="5" y1="114" x2="27" y2="114" strokeWidth="2.2" />
        <line className="col col-r-abacus" x1="73" y1="14" x2="95" y2="14" strokeWidth="2.2" />
        <line className="col col-r-echinus" x1="77" y1="18" x2="91" y2="18" strokeWidth="1.4" />
        <line className="col col-r-shaft" x1="84" y1="20" x2="84" y2="108" strokeWidth="3.6" />
        <line className="col fluting" x1="81" y1="24" x2="81" y2="104" strokeWidth="0.6" />
        <line className="col fluting" x1="87" y1="24" x2="87" y2="104" strokeWidth="0.6" />
        <line className="col col-r-base1" x1="77" y1="110" x2="91" y2="110" strokeWidth="1.4" />
        <line className="col col-r-base2" x1="73" y1="114" x2="95" y2="114" strokeWidth="2.2" />
        <text
          className="letter letter-r"
          x="50"
          y="60"
          textAnchor="middle"
          fontFamily="Inter Tight, sans-serif"
          fontSize="38"
          fontWeight="800"
        >
          R
        </text>
        <line className="copper-bar" x1="32" y1="66" x2="68" y2="66" strokeWidth="1.4" />
        <text
          className="letter letter-h"
          x="50"
          y="102"
          textAnchor="middle"
          fontFamily="Inter Tight, sans-serif"
          fontSize="38"
          fontWeight="800"
        >
          H
        </text>
      </svg>
    </span>
  );
}
