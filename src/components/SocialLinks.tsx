import { FaInstagram, FaGithub, FaLinkedin } from 'react-icons/fa';

const SocialLinks = () => (
  <div className="flex justify-center gap-6 mb-8 text-gray-600">
    <a href="https://www.instagram.com/yuyang_wang.oliver/" target="_blank" rel="noopener noreferrer" className="hover:text-pink-600 flex items-center gap-1">
      <FaInstagram /> Instagram
    </a>
    <a href="https://github.com/ydotwang" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 flex items-center gap-1">
      <FaGithub /> GitHub
    </a>
    <a href="https://www.linkedin.com/in/ydotwang/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-700 flex items-center gap-1">
      <FaLinkedin /> LinkedIn
    </a>
  </div>
);

export default SocialLinks; 