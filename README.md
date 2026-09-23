# TP11: UX/GUI - Prototipo Mesa de Ayuda

Este repositorio contiene el código fuente correspondiente al desarrollo práctico y prototipado del **Trabajo Práctico N° 11 (UX/GUI)** para la cátedra de **Ingeniería de Software I**.

Específicamente, aquí se aloja la implementación del **Punto 6**, el cual requería el diseño, flujo de navegación y código de un sistema preliminar de **Mesa de Ayuda (MesaAyuda)** enfocado en la experiencia de usuario (UX).

## Institución y Cátedra
* **Universidad:** Universidad Autónoma de Entre Ríos (UADER)
* **Facultad:** Facultad de Ciencia y Tecnología (FCyT) - Sede Concepción del Uruguay
* **Carrera:** Licenciatura en Sistemas de Información
* **Materia:** Ingeniería de Software I
* **Profesor:** Dr. Pedro E. Colla
* **Asistente:** Lic. Fernando Heit

## Integrantes del Grupo
* Delgado, Benjamín
* Donadío, Renzo
* Dutruel, Valentín
* Velzi, María Cecilia
---

## Contenido del Prototipo (Punto 6)

El código implementa una aplicación web/interfaz que modela el flujo completo de navegación y pantallas que un cliente utiliza al interactuar con el sistema de soporte. Los diálogos interactivos incluidos son:

1. **`landing page / loginCliente`**: Pantalla de acceso inicial optimizada mediante la Ley de Hicks.
2. **`registerCliente`**: Diálogo limpio y dedicado para el registro de nuevos usuarios.
3. **`resetCliente`**: Flujo completo para el blanqueo o cambio de password, dividido en pasos:
   * **`recovery`**: solicitud del correo asociado a la cuenta.
   * **`verify`**: ingreso del código OTP de validación recibido por e-mail.
   * **`new-password`**: definición de la nueva contraseña.
4. **`listTicket`**: Tablero o vista general que lista todos los tickets del cliente en cuestión, con filtrado por estado y opciones de sesión en el icono de usuario.
5. **`viewTicket`**: Detalle estructurado de un ticket específico (basado en la maqueta inicial de wireframe), con acciones para cancelarlo o agregarle detalles — bloqueadas si el ticket está resuelto o cancelado.
6. **`addTicket`**: Formulario dinámico para la creación y envío de un nuevo incidente.
7. **`appendTicket`**: Pantalla para incorporar un detalle adicional a un ticket existente (solo si éste sigue abierto).

> **Nota:** Todas las pantallas se montan sobre un marco de celular centrado en la página. Fuera de ellas, fijado en la esquina inferior, aparece un badge **Source Code** con el logo de GitHub que enlaza al repositorio del prototipo.
---
