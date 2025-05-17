import { FaInstagram, FaGithub, FaLinkedin } from 'react-icons/fa';

const SocialLinks = () => (
  <div className="flex justify-center gap-6 text-gray-400">
    <a 
      href="https://www.instagram.com/yuyang_wang.oliver/" 
      target="_blank" 
      rel="noopener noreferrer" 
      className="hover:text-pink-400 flex items-center gap-1 transition-colors duration-200"
      aria-label="Instagram"
    >
      <FaInstagram className="text-xl" />
      <span className="hidden sm:inline">Instagram</span>
    </a>
    <a 
      href="https://github.com/ydotwang" 
      target="_blank" 
      rel="noopener noreferrer" 
      className="hover:text-white flex items-center gap-1 transition-colors duration-200"
      aria-label="GitHub"
    >
      <FaGithub className="text-xl" />
      <span className="hidden sm:inline">GitHub</span>
    </a>
    <a 
      href="https://www.linkedin.com/in/ydotwang/" 
      target="_blank" 
      rel="noopener noreferrer" 
      className="hover:text-blue-400 flex items-center gap-1 transition-colors duration-200"
      aria-label="LinkedIn"
    >
      <FaLinkedin className="text-xl" />
      <span className="hidden sm:inline">LinkedIn</span>
    </a>
  </div>
);

export default SocialLinks; 