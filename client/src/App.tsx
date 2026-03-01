import { ThemeProvider } from "./components/ThemeProvider"
import Router from "./Router"
import { Toaster } from "sonner"

const App = () => {
  return (
    <>
      <Toaster
        position="top-right"
        richColors
      />
      <ThemeProvider
        defaultTheme="dark" 
        storageKey="vite-ui-theme"
      >
        <Router />
      </ThemeProvider>
    </>
  )
}

export default App
