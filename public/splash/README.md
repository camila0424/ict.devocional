# Pantalla de inicio (SplashScreen)

Coloca aquí estas dos imágenes con exactamente estos nombres:

- `ict-logo-white.png` — logo ICT en blanco, **fondo transparente** (PNG).
  Se revela de izquierda a derecha en el arranque.
- `oveja-saludo.png` — mascota (oveja) saludando, **fondo transparente** (PNG).
  Entra desde abajo y saluda para recibir al usuario.

El componente `src/components/shared/SplashScreen.tsx` las usa sobre el
color unificado de la marca `#1800AD` (mismo azul del centro del logo).

Si algún archivo falta, la pantalla sigue funcionando: el logo se
sustituye por el texto «ICT» y la oveja simplemente no aparece.
