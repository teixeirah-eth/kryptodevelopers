const StarAnimation = (props) => {
  const { children, overflowHidden } = props;

  return (
    <div
      className={`w-auto ${overflowHidden ? 'overflow-hidden' : ''} h-screen`}
      style={{
        background: 'linear-gradient(to top, #111827 , #0b2c38)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.125)',
      }}
      id="home"
    >
      <div id="stars"></div>
      <div id="stars2"></div>
      <div id="stars3"></div>
      {children}
    </div>
  );
};

StarAnimation.defaultProps = {
  overflowHidden: true,
};

export default StarAnimation;
