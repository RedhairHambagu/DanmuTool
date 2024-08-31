import { createRoot, type Root } from 'react-dom/client';
import Chat from './chatroom/Chat';

/* app */
const root: Root = createRoot(document.getElementById('app')!);

root.render(
    <Chat />
);