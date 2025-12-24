# Santa Flappy Bird

A fun Flappy Bird game featuring Santa Claus, built with React and Vite. Responsive design works on both desktop and mobile devices.

## Features

- 🎅 Santa Claus character
- 📱 Responsive design (works on mobile and desktop)
- 🎮 Touch and keyboard controls
- 🏆 High score tracking (saved in localStorage)
- ⚡ Built with React and Vite for fast performance

## Controls

- **Desktop**: Press `Space` or click to jump
- **Mobile**: Tap anywhere on the screen to jump

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Deploy to Vercel

1. Install Vercel CLI (if not already installed):
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

Or connect your GitHub repository to Vercel for automatic deployments.

## Project Structure

```
src/
├── components/
│   ├── Santa.jsx       # Santa character component
│   ├── Santa.css
│   ├── Pipe.jsx        # Pipe obstacles component
│   ├── Pipe.css
│   ├── Score.jsx       # Score display component
│   └── Score.css
├── App.jsx             # Main game logic
├── App.css
├── main.jsx            # Entry point
└── index.css           # Global styles
```

## Assets

- Santa sprite: `assets/santa.png` (512x512px)
- Pipe sprite: `assets/pipe.png` (1408x3040px)

## License

MIT
