# AuroraOS - Especificación de Requisitos Funcionales

## 1. Introducción

**AuroraOS** es un simulador de sistema operativo móvil de última generación, diseñado para emular el comportamiento y las capacidades de los sistemas operativos actuales (Android, iOS, HarmonyOS). Incorpora una interfaz intuitiva, multitarea realista, gestión eficiente de recursos y un ecosistema de aplicaciones nativas que cubren las necesidades cotidianas de comunicación, productividad y entretenimiento. Este documento detalla los requisitos funcionales que definen el alcance y las características del simulador.

---

## 2. Módulo de Interfaz de Usuario y Gestor de Ventanas (UI / Window Manager)

**RF-01: Pantalla de Inicio (Launcher)**  
El simulador debe mostrar una interfaz gráfica principal que contenga una cuadrícula de iconos interactivos correspondientes a las aplicaciones disponibles (ej. Ajustes, Navegador, Cámara, Reloj, Mensajes, Teléfono, Galería, Archivos, etc.).

**RF-02: Barra de Estado y Notificaciones**  
El sistema debe incluir una barra superior persistente que muestre indicadores en tiempo real (nivel de batería, conectividad simulada de red/Wi-Fi y hora actual), además de permitir desplegar un panel de notificaciones flotantes con acceso rápido a ajustes y mensajes entrantes.

**RF-03: Navegación Táctil / Gestual**  
El simulador debe registrar eventos de clic y arrastre del ratón para emular gestos táctiles (tocar para abrir, deslizar hacia los lados para cambiar de pantalla, o deslizar hacia arriba para cerrar/minimizar una aplicación). También debe soportar gestos multitáctiles simulados (p. ej., pellizcar para zoom).

**RF-17: Personalización de Fondo de Pantalla**  
El sistema debe permitir al usuario cambiar el fondo de pantalla del escritorio y de la pantalla de bloqueo, seleccionando entre imágenes predeterminadas o importadas desde el almacenamiento interno o desde la galería.

**RF-20: Modo Oscuro y Temas**  
El simulador debe ofrecer un modo oscuro global que invierta los colores de la interfaz del sistema y de las aplicaciones compatibles, así como la posibilidad de elegir entre varios temas de acento cromático.

---

## 3. Módulo de Gestión de Procesos y Ciclo de Vida de Aplicaciones

**RF-04: Ejecución Concurrente**  
El simulador debe permitir la ejecución simultánea de múltiples aplicaciones en un entorno multitarea, mostrando las aplicaciones en ejecución en un selector de tareas (vista de tarjetas).

**RF-05: Ciclo de Vida de Apps (Foreground / Background)**  
El sistema operativo simulado debe gestionar los estados de las aplicaciones móviles:
- *Running* (en primer plano y activa).
- *Paused / Background* (en segundo plano, consumiendo recursos mínimos).
- *Terminated* (cerrada explícitamente o por falta de memoria).

**RF-06: Manejo de Memoria Estrecha (Low Memory Killer)**  
El simulador debe monitorear el consumo de RAM de las aplicaciones abiertas y terminar automáticamente la aplicación en segundo plano con mayor antigüedad o menor prioridad cuando el umbral de memoria simulada supere el 85%.

**RF-21: Administrador de Tareas Mejorado**  
El sistema debe proporcionar una vista detallada de los procesos activos, permitiendo al usuario forzar la detención de una aplicación, ajustar su prioridad o establecer restricciones en segundo plano.

---

## 4. Módulo de Gestión de Energía y Batería (Power Management)

**RF-07: Consumo Dinámico de Batería**  
El sistema debe disminuir el porcentaje de la batería simulada en función de la carga de trabajo actual (ej. mayor consumo si hay aplicaciones exigentes en primer plano, brillo de pantalla alto o uso del módulo de red).

**RF-08: Modo de Ahorro de Energía**  
El usuario debe poder activar un interruptor de "Ahorro de Batería" que limite la frecuencia de procesamiento simulada (CPU throttling) y suspenda los procesos en segundo plano no esenciales para extender la vida útil de la batería.

**RF-22: Estadísticas de Batería por Aplicación**  
El sistema debe mostrar un desglose del consumo energético estimado por cada aplicación, para que el usuario identifique los mayores consumidores y tome decisiones de uso.

---

## 5. Módulo de Almacenamiento y Sistema de Archivos

**RF-09: Almacenamiento Interno Persistente**  
El simulador debe proveer un sistema de archivos virtual jerárquico donde las aplicaciones puedan leer y escribir datos persistentes (ej. configuraciones de usuario, notas guardadas, fotos simuladas).

**RF-10: Gestor de Archivos (App de Explorador)**  
Debe incluir una aplicación utilitaria que permita al usuario visualizar la estructura de carpetas interna, ver el espacio ocupado y eliminar archivos temporales o caché de aplicaciones.

**RF-23: Almacenamiento en la Nube Simulado**  
El sistema debe ofrecer un servicio de almacenamiento en la nube integrado (simulado) que permita sincronizar archivos y fotos entre el simulador y un directorio del PC anfitrión, facilitando la transferencia de datos.

---

## 6. Módulo de Periféricos y Sensores Simulados

**RF-11: Simulación de Cámara y Galería**  
El simulador debe permitir "tomar una foto" (cargando una imagen predeterminada o seleccionada desde el PC anfitrión) y almacenarla en una galería de fotos accesible por otras aplicaciones.

**RF-16: Cámara en Vivo**  
El simulador debe ser capaz de utilizar la cámara del dispositivo anfitrión (webcam) para capturar imágenes y vídeo en tiempo real dentro de la aplicación de Cámara, emulando una experiencia de captura auténtica.

**RF-12: Geolocalización (GPS Virtual)**  
El sistema debe proveer una interfaz para modificar o simular coordenadas geográficas (latitud y longitud) que las aplicaciones basadas en ubicación puedan consultar mediante una API simulada.

**RF-24: Sensores de Movimiento (Acelerómetro/Giroscopio)**  
El simulador debe emular datos de orientación y movimiento, permitiendo que las aplicaciones que utilicen estos sensores (ej. juegos, brújula) reciban valores simulados ajustables por el usuario.

---

## 7. Módulo de Comunicaciones y Mensajería

**RF-15: Aplicación de Teléfono y Mensajería Nativa**  
El sistema debe incluir una aplicación de Teléfono que permita realizar y recibir llamadas simuladas (VoIP) y una aplicación de Mensajes que soporte SMS y MMS simulados, con historial de conversaciones, contactos y notificaciones.

**RF-19: Integración con Aplicaciones de Mensajería Externa (WhatsApp / Telegram)**  
El simulador debe proporcionar un marco de notificaciones y servicios que permita la instalación y ejecución de aplicaciones de mensajería populares (WhatsApp, Telegram). Estas aplicaciones podrán conectarse a través de una API simulada que reciba y envíe mensajes de prueba, mostrando notificaciones en tiempo real y sincronizando contactos.

**RF-25: Llamadas y Videollamadas Grupales**  
La aplicación de Teléfono debe soportar conferencias y videollamadas grupales simuladas, con la posibilidad de compartir pantalla y enviar archivos durante la llamada.

**RF-26: Agenda de Contactos Unificada**  
El sistema debe gestionar una agenda de contactos centralizada, accesible desde las aplicaciones de Teléfono, Mensajes y Correo, con campos para nombre, número, correo, dirección, foto y cuentas de redes sociales.

---

## 8. Módulo de Red y Navegación

**RF-13 (Ajustes de Conectividad):**  
Dentro de la aplicación de Ajustes, el usuario podrá activar/desactivar Wi-Fi o Datos Móviles, y configurar redes Wi-Fi simuladas.

**RF-18: Navegador con Descarga de Imágenes**  
El navegador web integrado debe permitir navegar por sitios web (simulados o reales a través de un proxy), descargar imágenes y guardarlas directamente en la galería o en el almacenamiento interno. También debe soportar pestañas, marcadores e historial.

**RF-27: Cliente de Correo Electrónico**  
El simulador debe incluir una aplicación de correo que permita configurar cuentas IMAP/POP3 simuladas, enviar y recibir correos, con adjuntos y una bandeja de entrada organizada.

**RF-28: Compartir Archivos por Bluetooth / NFC**  
El sistema debe emular el envío y recepción de archivos mediante Bluetooth o NFC, mostrando un proceso de pareamiento y transferencia simulado.

---

## 9. Módulo de Ajustes y Configuración del Sistema

**RF-13 (completo) – Panel de Control (Settings):**  
Una aplicación de configuración que permita modificar parámetros globales del sistema operativo móvil:
- Brillo de pantalla (con impacto directo en el consumo de batería).
- Conectividad (activar/desactivar Wi-Fi o Datos Móviles).
- Idioma y zona horaria.
- Sonidos y vibración.
- Seguridad y bloqueo (PIN, patrón, huella simulada).

**RF-14: Monitor de Recursos (Developer Options)**  
Una sección de diagnóstico que permita visualizar en tiempo real el uso de CPU simulada, memoria RAM consumida por cada proceso activo y el estado actual de la batería.

**RF-29: Actualizaciones del Sistema (OTA)**  
El simulador debe incluir un mecanismo de actualización "Over-The-Air" que permita descargar e instalar nuevas versiones del sistema operativo, mejorando funcionalidades o corrigiendo errores, con notificaciones de disponibilidad.

**RF-30: Soporte para Múltiples Usuarios y Modo Invitado**  
El sistema debe permitir la creación de varios perfiles de usuario, cada uno con sus propias aplicaciones, ajustes y datos, así como un modo invitado con restricciones.

**RF-31: Asistente de Voz Inteligente**  
El simulador debe incorporar un asistente de voz (similar a Google Assistant o Siri) que pueda responder a comandos de voz simulados, realizar búsquedas, abrir aplicaciones y controlar ajustes del sistema.

---

## 10. Módulo de Seguridad y Privacidad

**RF-32: Gestor de Contraseñas y Autenticación Biométrica**  
El sistema debe ofrecer un gestor de contraseñas integrado y soporte para autenticación mediante huella dactilar o reconocimiento facial (simulado), para desbloquear el dispositivo y autorizar pagos.

**RF-33: Permisos de Aplicaciones Granulares**  
Las aplicaciones deberán solicitar permisos específicos (cámara, micrófono, ubicación, contactos, almacenamiento) en tiempo de ejecución, y el usuario podrá revocarlos desde el panel de ajustes.

**RF-34: Cifrado de Datos y Modo Seguro**  
El sistema debe permitir cifrar el almacenamiento interno y activar un modo seguro que aísle aplicaciones sospechosas o descargas de fuentes no confiables.

---

## 11. Módulo de Entretenimiento y Multimedia

**RF-35: Reproductor de Música y Vídeo**  
El simulador debe incluir aplicaciones nativas para reproducir audio y vídeo desde el almacenamiento local, con soporte para listas de reproducción, ecualizador y subtítulos.

**RF-36: Tienda de Aplicaciones (App Store)**  
Debe contar con una tienda de aplicaciones simulada donde el usuario pueda explorar, descargar e instalar aplicaciones adicionales (simuladas) de diversas categorías, con actualizaciones automáticas.

**RF-37: Juegos y Realidad Aumentada (Simulación)**  
El sistema debe ser capaz de ejecutar juegos sencillos y demostrar capacidades de realidad aumentada usando la cámara y sensores simulados.

---

## 12. Funcionalidades Avanzadas (Tendencias 2025-2026)

**RF-38: Asistente IA Integrado (Chocolate Plan)**  
El sistema debe incorporar un asistente de inteligencia artificial llamado "Chocolate Plan" que responda a comandos de voz/texto, realice búsquedas, abra aplicaciones y controle ajustes del sistema mediante una interfaz de chat conversacional.

**RF-39: Modo Focus / No Molestar**  
El sistema debe ofrecer un modo de concentración que silencie todas las notificaciones y aplicaciones no esenciales durante un período configurado por el usuario, promoviendo el bienestar digital.

**RF-40: Widgets Interactivos**  
La pantalla de inicio debe soportar widgets reales y interactivos (reloj en tiempo real, clima, notas rápidas, estado de batería) que se actualicen dinámicamente sin necesidad de abrir la aplicación correspondiente.

**RF-41: Gestión de Espacio Inteligente**  
El sistema debe monitorear el uso de almacenamiento y sugerir automáticamente acciones cuando el espacio esté bajo umbral crítico, como eliminar archivos temporales o desinstalar aplicaciones poco utilizadas.

**RF-42: Compartir Contenido entre Apps**  
El sistema debe implementar un mecanismo de compartir (share sheet) que permita enviar contenido desde una aplicación a otra, similar al sistema de intents de Android o el share sheet de iOS.

**RF-43: Modo Un Minimalista**  
El sistema debe ofrecer una interfaz simplificada con iconos grandes, alto contraste y funcionalidades limitadas para usuarios con necesidades de accesibilidad o que prefieren una experiencia reducida.

**RF-44: Historial de Actividad**  
El sistema debe mantener un registro cronológico de las acciones recientes del usuario (apps abiertas, archivos modificados, configuraciones cambiadas) accesible desde un panel de actividad.

**RF-45: Soporte para Idiomas RTL**  
El sistema debe soportar la internacionalización completa incluyendo idiomas de escritura de derecha a izquierda (RTL) como árabe y hebreo, ajustando automáticamente la dirección de la interfaz.

**RF-46: Animaciones de Transición entre Apps**  
Al abrir o cerrar una aplicación, el sistema debe reproducir animaciones de transición fluidas (zoom-in/out, slide) que emulen el comportamiento de los sistemas operativos móviles modernos.

**RF-47: Split Screen Simulado**  
El sistema debe permitir la visualización de dos aplicaciones simultáneamente en modo dividido cuando la orientación de la pantalla sea horizontal (landscape), simulando la funcionalidad de multitarea avanzada.

---

## 13. Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | React 18+ TypeScript |
| Bundler | Vite |
| Estado Global | Zustand |
| Persistencia | IndexedDB (Dexie.js) |
| Estilos | Tailwind CSS + CSS Variables |
| Animaciones | Framer Motion |
| Iconos | Lucide React |

---

## 14. Consideraciones Finales

Todos los requisitos funcionales descritos deben ser implementados en el simulador de manera integrada, ofreciendo una experiencia de usuario fluida y realista. El sistema debe ser extensible para añadir nuevas funcionalidades en futuras versiones, y su arquitectura debe permitir la simulación de escenarios de uso cotidianos para fines educativos, de demostración o de pruebas de aplicaciones.

---

**Fin del documento**