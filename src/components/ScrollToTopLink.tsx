import { Link, LinkProps } from 'react-router-dom';

const ScrollToTopLink = ({ children, ...props }: LinkProps) => {
  const handleClick = () => {
    window.scrollTo(0, 0);
  };

  return (
    <Link {...props} onClick={handleClick} className={props.className}>
      {children}
    </Link>
  );
};

export default ScrollToTopLink; 