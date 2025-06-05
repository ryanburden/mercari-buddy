# Ecommerce Intelligence Platform - Frontend

A modern, responsive React TypeScript landing page for the AI-powered ecommerce intelligence platform.

## 🚀 Features

- **Modern Design**: Beautiful, responsive UI with glassmorphism effects
- **File Upload**: Drag-and-drop CSV upload with validation and preview
- **AI Integration**: Ready for FastAPI backend integration
- **Performance**: Optimized with Vite for fast development and builds
- **Accessibility**: WCAG compliant design
- **TypeScript**: Full type safety throughout the application

## 🛠️ Tech Stack

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Dropzone** - File upload functionality
- **Lucide React** - Beautiful, consistent icons

## 📦 Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

4. **Preview production build:**
   ```bash
   npm run preview
   ```

## 🎨 Design System

### Colors
- **Primary**: Blue gradient (`#3b82f6` to `#2563eb`)
- **Secondary**: Purple gradient (`#a855f7` to `#9333ea`)
- **Background**: Dark gradient with glassmorphism effects

### Typography
- **Display Font**: Poppins (headings)
- **Body Font**: Inter (body text)

### Components
- **Glass Cards**: Backdrop blur with border effects
- **Gradient Buttons**: Smooth hover animations
- **Responsive Grid**: Mobile-first design

## 📁 Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Layout.tsx          # Main layout with nav/footer
│   │   ├── HeroSection.tsx     # Landing hero section
│   │   ├── FeaturesSection.tsx # Features showcase
│   │   ├── HowItWorks.tsx      # Process explanation
│   │   └── FileUpload.tsx      # CSV upload component
│   ├── utils/
│   │   └── fileValidation.ts   # File validation utilities
│   ├── styles/
│   │   └── globals.css         # Global styles and Tailwind
│   ├── App.tsx                 # Main app component
│   └── main.tsx               # React entry point
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── tsconfig.json
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the frontend directory:
```env
VITE_API_URL=http://localhost:8000  # Your FastAPI backend URL
```

### Backend Integration
The FileUpload component is ready for FastAPI integration. Update the `handleAnalyze` function in `FileUpload.tsx`:

```typescript
const handleAnalyze = async () => {
  const formData = new FormData();
  formData.append('file', uploadedFile);
  
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/analyze`, {
      method: 'POST',
      body: formData,
    });
    
    const result = await response.json();
    // Handle response
  } catch (error) {
    console.error('Analysis failed:', error);
  }
};
```

## 🎯 Key Components

### FileUpload Component
- Drag-and-drop interface
- File validation (CSV, size limits)
- Preview functionality
- Progress indicators
- Error handling

### Features Showcase
- AI categorization capabilities
- Performance metrics
- Temporal analysis features
- Interactive hover effects

### Responsive Design
- Mobile-first approach
- Tablet optimizations
- Desktop enhancements
- Smooth animations

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel --prod
```

### Deploy to Netlify
```bash
npm run build
# Upload dist/ folder to Netlify
```

## 🔗 API Integration

The frontend is designed to integrate with your FastAPI backend. Key integration points:

1. **File Upload**: POST `/api/analyze` with CSV file
2. **Results**: GET `/api/results/{job_id}` for analysis results
3. **Status**: GET `/api/status/{job_id}` for processing status

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🎨 Customization

### Colors
Update `tailwind.config.js` to customize the color scheme:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // Your custom primary colors
      },
      secondary: {
        // Your custom secondary colors
      }
    }
  }
}
```

### Fonts
Update the Google Fonts import in `index.html` and the font configuration in `tailwind.config.js`.

## 📄 License

This project is part of the Ecommerce Intelligence Platform.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Built with ❤️ for modern ecommerce intelligence** 