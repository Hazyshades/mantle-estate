import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc'
import fs from 'fs'
import { copyFileSync, mkdirSync, readdirSync } from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const docsBuildPath = path.resolve(__dirname, 'docusaurus-docs/build')
const docsOutputPath = path.resolve(__dirname, 'dist/docs')

// Function to copy directory recursively
function copyDir(src: string, dest: string) {
  if (!fs.existsSync(dest)) {
    mkdirSync(dest, { recursive: true })
  }
  
  const entries = readdirSync(src, { withFileTypes: true })
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath)
    } else {
      copyFileSync(srcPath, destPath)
    }
  }
}

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
      '~backend/client': path.resolve(__dirname, './client'),
      '~backend': path.resolve(__dirname, '../backend'),
    },
  },
  plugins: [
    tailwindcss(), 
    react({
      // Using SWC for JSX compilation (no Babel required)
      jsxRuntime: 'automatic',
    }),
    // Plugin to copy Docusaurus docs to dist/docs during build
    {
      name: 'copy-docs',
      closeBundle() {
        if (fs.existsSync(docsBuildPath)) {
          console.log('Copying Docusaurus docs to dist/docs...')
          copyDir(docsBuildPath, docsOutputPath)
          console.log('Docs copied successfully!')
        } else {
          console.warn('Docusaurus build directory not found. Make sure to run "bun run build:docs:once" before building.')
        }
      },
    },
    // Plugin for serving static files Docusaurus (dev server only)
    {
      name: 'docusaurus-static',
      configureServer(server) {
        server.middlewares.use('/docs', (req, res, next) => {
          // Remove the /docs prefix from the path
          let filePath = req.url?.replace(/^\/docs/, '') || '/'
          
          // Normalize the path - redirect root to intro
          if (filePath === '/' || filePath === '') {
            res.writeHead(302, { Location: '/docs/intro/' })
            res.end()
            return
          }
          
          // If the path ends with /, add index.html
          if (filePath.endsWith('/') && !filePath.endsWith('/index.html')) {
            filePath = filePath + 'index.html'
          }
          
          const fullPath = path.join(docsBuildPath, filePath)
          
          // Check if the file exists
          if (fs.existsSync(fullPath)) {
            const stats = fs.statSync(fullPath)
            if (stats.isFile()) {
              // Define the Content-Type
              const ext = path.extname(fullPath)
              const contentTypes: Record<string, string> = {
                '.html': 'text/html',
                '.js': 'application/javascript',
                '.css': 'text/css',
                '.json': 'application/json',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.svg': 'image/svg+xml',
                '.woff': 'font/woff',
                '.woff2': 'font/woff2',
              }
              res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream')
              res.end(fs.readFileSync(fullPath))
              return
            } else if (stats.isDirectory()) {
              // If this is a directory, try to find index.html
              const indexPath = path.join(fullPath, 'index.html')
              if (fs.existsSync(indexPath)) {
                res.setHeader('Content-Type', 'text/html')
                res.end(fs.readFileSync(indexPath))
                return
              }
            }
          }
          
          // If nothing is found, try to find index.html in the parent directory
          const dirPath = path.dirname(fullPath)
          const indexPath = path.join(dirPath, 'index.html')
          if (fs.existsSync(indexPath)) {
            res.setHeader('Content-Type', 'text/html')
            res.end(fs.readFileSync(indexPath))
          } else {
            next()
          }
        })
      },
    },
  ],
  build: {
    outDir: "dist",
    minify: process.env.NODE_ENV === "production",
    sourcemap: process.env.NODE_ENV === "development",
  },
  server: {
    fs: {
      // Allow access to files outside the root project
      allow: ['..'],
    },
  },
})
