{
  id: "real-estate-trading-simulator-t9ii"
  lang: "typescript"
  
  global_cors: {
    allow_origins_without_credentials: [
      "*"
    ]
    
    allow_origins_with_credentials: [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:5174",
      "https://mantle-estate-frontend-git-vercel-xetras-projects-a56da406.vercel.app",
      "https://*.vercel.app"
    ]
    
    allow_headers: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept"
    ]
    
    allow_methods: [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "OPTIONS",
      "PATCH",
      "HEAD"
    ]
    
    expose_headers: [
      "Content-Type",
      "Authorization"
    ]
    
    allow_credentials: true
  }
}
