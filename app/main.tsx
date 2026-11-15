import { createRoot } from 'react-dom/client';
import App from './app';
import './styles/theme.css';

// Root component.
function Root() {
  return <App />;
}

const rootNode = document.querySelector('#app-container')!;
const root = createRoot(rootNode);
root.render(<Root />);
