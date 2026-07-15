import { createApp } from './app.js';

const PORT = process.env.PORT || 1234;

createApp().listen(PORT, () => {
  console.log(`Commit diff viewer listening on http://localhost:${PORT}`);
});
