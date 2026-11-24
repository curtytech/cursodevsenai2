/**
 * Iconsax Animated Web Component (<isax-anim>)
 * ---------------------------------------------------------------------------
 * Renderiza ícones vetoriais animados no estilo arredondado/duotone do Iconsax
 * (https://app.iconsax.io/?tab=animated) e oferece suporte nativo opcional
 * para arquivos Lottie JSON via atributo `lottie-src="caminho/icone.json"`.
 *
 * Uso:
 *   <isax-anim name="add-circle" size="20"></isax-anim>
 *   <isax-anim name="tick-circle" size="22" trigger="mount"></isax-anim>
 *   <isax-anim name="compass" size="22" trigger="ambient"></isax-anim>
 *   <isax-anim name="trash" lottie-src="/assets/icons/trash.json" size="22"></isax-anim>
 */
(() => {
  const ICONS = {
    'home': `
      <path class="isax-duotone" d="M12 2.8 4.2 8.7c-.8.6-1.2 1.5-1.2 2.5V19c0 1.4 1.1 2.5 2.5 2.5h13c1.4 0 2.5-1.1 2.5-2.5v-7.8c0-1-.4-1.9-1.2-2.5L12 2.8Z" fill="currentColor"/>
      <path class="isax-part isax-anim-up" d="M3.2 10.6 10.7 4.6c.8-.6 1.8-.6 2.6 0l7.5 6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M5.5 9.5V19c0 1.2 1 2.2 2.2 2.2h8.6c1.2 0 2.2-1 2.2-2.2V9.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path class="isax-part isax-draw isax-anim-draw" d="M12 18v-3.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
    `,
    'menu': `
      <path class="isax-part isax-anim-right" d="M4 7h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M4 12h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      <path class="isax-part isax-anim-left" d="M4 17h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    `,
    'close': `
      <g class="isax-part isax-anim-spin-q">
        <path d="M6.5 6.5 17.5 17.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M17.5 6.5 6.5 17.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </g>
    `,
    'arrow-right': `
      <g class="isax-part isax-anim-right">
        <path d="M14.43 5.93 20.5 12l-6.07 6.07" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <path d="M3.5 12h16.83" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </g>
    `,
    'arrow-left': `
      <g class="isax-part isax-anim-left">
        <path d="M9.57 5.93 3.5 12l6.07 6.07" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <path d="M20.5 12H3.67" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </g>
    `,
    'external-link': `
      <path d="M11 4H6.8C4.8 4 3.5 5.3 3.5 7.3v9.9c0 2 1.3 3.3 3.3 3.3h9.9c2 0 3.3-1.3 3.3-3.3V13" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <g class="isax-part isax-anim-send">
        <path d="M13 11 20.5 3.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <path d="M15.5 3.5h5v5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </g>
    `,
    'sun': `
      <circle class="isax-duotone" cx="12" cy="12" r="5" fill="currentColor"/>
      <circle class="isax-part isax-anim-breath" cx="12" cy="12" r="4.5" stroke="currentColor" stroke-width="1.7" fill="none"/>
      <g class="isax-part isax-anim-spin-q" stroke="currentColor" stroke-width="1.7" stroke-linecap="round">
        <path d="M12 2.5v2"/><path d="M12 19.5v2"/><path d="M4.93 4.93l1.41 1.41"/><path d="M17.66 17.66l1.41 1.41"/>
        <path d="M2.5 12h2"/><path d="M19.5 12h2"/><path d="M4.93 19.07l1.41-1.41"/><path d="M17.66 6.34l1.41-1.41"/>
      </g>
    `,
    'moon': `
      <path class="isax-duotone" d="M20.3 14.8A8.5 8.5 0 0 1 9.2 3.7a8.6 8.6 0 1 0 11.1 11.1Z" fill="currentColor"/>
      <path class="isax-part isax-anim-compass" d="M20.3 14.8A8.5 8.5 0 0 1 9.2 3.7a8.6 8.6 0 1 0 11.1 11.1Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    `,
    'search': `
      <circle class="isax-duotone" cx="11.2" cy="11.2" r="7.2" fill="currentColor"/>
      <g class="isax-part isax-anim-breath">
        <circle cx="11.2" cy="11.2" r="7.2" stroke="currentColor" stroke-width="1.7" fill="none"/>
        <path d="M20.5 20.5 16.8 16.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </g>
    `,
    'filter': `
      <path class="isax-duotone" d="M4.5 5h15l-5.6 6.8v6.2l-3.8 1.8v-8L4.5 5Z" fill="currentColor"/>
      <path class="isax-part isax-anim-up" d="M4.5 5h15l-5.6 6.8v6.2l-3.8 1.8v-8L4.5 5Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    `,
    'compass': `
      <circle class="isax-duotone" cx="12" cy="12" r="9.2" fill="currentColor"/>
      <circle cx="12" cy="12" r="9.2" stroke="currentColor" stroke-width="1.65" fill="none"/>
      <polygon class="isax-part isax-anim-compass" points="15.8,8.2 13.5,13.5 8.2,15.8 10.5,10.5" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" fill="currentColor" fill-opacity="0.22"/>
    `,
    'add-circle': `
      <circle class="isax-duotone" cx="12" cy="12" r="9.2" fill="currentColor"/>
      <circle cx="12" cy="12" r="9.2" stroke="currentColor" stroke-width="1.7" fill="none"/>
      <g class="isax-part isax-anim-spin-q">
        <path d="M8.5 12h7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M12 8.5v7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </g>
    `,
    'check': `
      <path class="isax-part isax-draw isax-anim-draw" d="M5.5 12.6 9.8 17l8.7-9.4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    `,
    'tick-circle': `
      <circle class="isax-duotone" cx="12" cy="12" r="9.2" fill="currentColor"/>
      <circle cx="12" cy="12" r="9.2" stroke="currentColor" stroke-width="1.7" fill="none"/>
      <path class="isax-part isax-draw isax-anim-draw" d="M8.2 12.2 10.7 14.7 15.8 9.4" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    `,
    'circle': `
      <circle class="isax-part isax-anim-breath" cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.7" fill="none"/>
    `,
    'edit': `
      <path d="M11 4H6.8C4.8 4 3.5 5.3 3.5 7.3v9.9c0 2 1.3 3.3 3.3 3.3h9.9c2 0 3.3-1.3 3.3-3.3V13" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <g class="isax-part isax-anim-write">
        <path class="isax-duotone" d="M16.2 4.3a2.1 2.1 0 0 1 3 3l-8 8-3.7.8.8-3.7 7.9-8.1Z" fill="currentColor"/>
        <path d="M16.2 4.3a2.1 2.1 0 0 1 3 3l-8 8-3.7.8.8-3.7 7.9-8.1Z" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </g>
    `,
    'trash': `
      <g class="isax-part isax-anim-lid">
        <path d="M3.5 6.2h17" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
        <path d="M8.8 6.2V4.6c0-.9.7-1.6 1.6-1.6h3.2c.9 0 1.6.7 1.6 1.6v1.6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </g>
      <path class="isax-duotone" d="M5.6 6.2h12.8l-.8 12.1c-.1 1.5-1.3 2.7-2.8 2.7H9.2c-1.5 0-2.7-1.2-2.8-2.7L5.6 6.2Z" fill="currentColor"/>
      <path d="M5.6 6.2h12.8l-.8 12.1c-.1 1.5-1.3 2.7-2.8 2.7H9.2c-1.5 0-2.7-1.2-2.8-2.7L5.6 6.2Z" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M10.2 11.2v5.2M13.8 11.2v5.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
    `,
    'upload': `
      <path d="M4 15.5v1.8c0 1.9 1.5 3.2 3.4 3.2h9.2c1.9 0 3.4-1.3 3.4-3.2v-1.8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" fill="none"/>
      <g class="isax-part isax-anim-up">
        <path d="M12 15V4.2" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
        <path d="M8.2 7.8 12 4l3.8 3.8" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </g>
    `,
    'link': `
      <g class="isax-part isax-anim-breath">
        <path d="M10 13.8a4.2 4.2 0 0 0 6 .3l2.6-2.6a4.2 4.2 0 0 0-6-6l-1.5 1.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" fill="none"/>
        <path d="M14 10.2a4.2 4.2 0 0 0-6-.3L5.4 12.5a4.2 4.2 0 0 0 6 6l1.5-1.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" fill="none"/>
      </g>
    `,
    'eye': `
      <path class="isax-duotone" d="M2.5 12s3.7-6.5 9.5-6.5S21.5 12 21.5 12s-3.7 6.5-9.5 6.5S2.5 12 2.5 12Z" fill="currentColor"/>
      <path d="M2.5 12s3.7-6.5 9.5-6.5S21.5 12 21.5 12s-3.7 6.5-9.5 6.5S2.5 12 2.5 12Z" stroke="currentColor" stroke-width="1.65" stroke-linejoin="round" fill="none"/>
      <circle class="isax-part isax-anim-breath" cx="12" cy="12" r="2.8" stroke="currentColor" stroke-width="1.65" fill="none"/>
    `,
    'refresh': `
      <g class="isax-part isax-anim-spin-h">
        <path d="M19.8 12a7.8 7.8 0 1 1-2.1-5.3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" fill="none"/>
        <path d="M19.8 4.2v3.6h-3.6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </g>
    `,
    'send': `
      <g class="isax-part isax-anim-send">
        <path class="isax-duotone" d="M20.4 3.6 3.7 10.2c-.8.3-.7 1.4.1 1.6l6.1 1.9 1.9 6.1c.2.8 1.3.9 1.6.1L20.4 3.6Z" fill="currentColor"/>
        <path d="M20.4 3.6 3.7 10.2c-.8.3-.7 1.4.1 1.6l6.1 1.9 1.9 6.1c.2.8 1.3.9 1.6.1L20.4 3.6Z" stroke="currentColor" stroke-width="1.65" stroke-linejoin="round" fill="none"/>
        <path d="M10 13.7 20 4" stroke="currentColor" stroke-width="1.65" stroke-linecap="round"/>
      </g>
    `,
    'users': `
      <circle class="isax-duotone" cx="9.2" cy="8.2" r="3.4" fill="currentColor"/>
      <circle class="isax-part isax-anim-up" cx="9.2" cy="8.2" r="3.4" stroke="currentColor" stroke-width="1.65" fill="none"/>
      <path d="M3.2 19.2c0-2.9 2.7-5 6-5s6 2.1 6 5" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" fill="none"/>
      <path class="isax-part isax-anim-right" d="M15.4 5.4a2.8 2.8 0 0 1 0 5.6M16.8 14.6c2.2.5 4 2.1 4 4.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none"/>
    `,
    'user-add': `
      <circle class="isax-duotone" cx="9.5" cy="8.2" r="3.5" fill="currentColor"/>
      <circle cx="9.5" cy="8.2" r="3.5" stroke="currentColor" stroke-width="1.65" fill="none"/>
      <path d="M3.5 19.2c0-2.9 2.7-5 6-5 1.8 0 3.4.6 4.5 1.6" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" fill="none"/>
      <g class="isax-part isax-anim-spin-q">
        <path d="M18 13.5v5M15.5 16h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </g>
    `,
    'video-play': `
      <rect class="isax-duotone" x="2.8" y="4.5" width="18.4" height="15" rx="4" fill="currentColor"/>
      <rect x="2.8" y="4.5" width="18.4" height="15" rx="4" stroke="currentColor" stroke-width="1.65" fill="none"/>
      <path class="isax-part isax-anim-right" d="M10.2 9.4 15.2 12l-5 2.6V9.4Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" fill="currentColor" fill-opacity="0.25"/>
    `,
    'code': `
      <path class="isax-part isax-anim-left" d="M8.5 7.5 3.8 12l4.7 4.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path class="isax-part isax-anim-right" d="M15.5 7.5 20.2 12l-4.7 4.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path class="isax-part isax-draw isax-anim-draw" d="M13.5 5.2 10.5 18.8" stroke="currentColor" stroke-width="1.65" stroke-linecap="round"/>
    `,
    'database': `
      <ellipse class="isax-duotone" cx="12" cy="6.2" rx="7.5" ry="3" fill="currentColor"/>
      <ellipse class="isax-part isax-anim-up" cx="12" cy="6.2" rx="7.5" ry="3" stroke="currentColor" stroke-width="1.65" fill="none"/>
      <path d="M4.5 6.2v11.6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3V6.2" stroke="currentColor" stroke-width="1.65" fill="none"/>
      <path class="isax-part isax-anim-breath" d="M4.5 12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3" stroke="currentColor" stroke-width="1.6" fill="none"/>
    `,
    'folder-open': `
      <path class="isax-duotone" d="M3.2 7.5c0-1.6 1.2-2.8 2.8-2.8h3.4c.8 0 1.5.4 2 1l.9 1.2H18c1.6 0 2.8 1.2 2.8 2.8v6.8c0 1.6-1.2 2.8-2.8 2.8H6c-1.6 0-2.8-1.2-2.8-2.8V7.5Z" fill="currentColor"/>
      <path class="isax-part isax-anim-up" d="M3.2 7.5c0-1.6 1.2-2.8 2.8-2.8h3.4c.8 0 1.5.4 2 1l.9 1.2H18c1.6 0 2.8 1.2 2.8 2.8v6.8c0 1.6-1.2 2.8-2.8 2.8H6c-1.6 0-2.8-1.2-2.8-2.8V7.5Z" stroke="currentColor" stroke-width="1.65" stroke-linejoin="round" fill="none"/>
      <path d="M7.5 13.5h9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
    `,
    'book': `
      <g class="isax-part isax-anim-book">
        <path class="isax-duotone" d="M12 6.2C9.8 4.8 6.4 4.5 3.5 5.2v12.8c2.9-.7 6.3-.4 8.5 1 2.2-1.4 5.6-1.7 8.5-1V5.2c-2.9-.7-6.3-.4-8.5 1Z" fill="currentColor"/>
        <path d="M12 6.2C9.8 4.8 6.4 4.5 3.5 5.2v12.8c2.9-.7 6.3-.4 8.5 1 2.2-1.4 5.6-1.7 8.5-1V5.2c-2.9-.7-6.3-.4-8.5 1Z" stroke="currentColor" stroke-width="1.65" stroke-linejoin="round" fill="none"/>
        <path d="M12 6.2V19" stroke="currentColor" stroke-width="1.65" stroke-linecap="round"/>
      </g>
    `,
    'flame': `
      <g class="isax-part isax-anim-up">
        <path class="isax-duotone" d="M12.4 3.2c.4 3.2-2.4 4.7-2.4 7.3 0 1.4 1 2.5 2.4 2.5 1.7 0 2.8-1.6 2.6-3.7 2.2 1.6 3.5 3.9 3.5 6.4A6.5 6.5 0 0 1 5.5 15.7c0-4.1 2.9-7.9 6.9-12.5Z" fill="currentColor"/>
        <path d="M12.4 3.2c.4 3.2-2.4 4.7-2.4 7.3 0 1.4 1 2.5 2.4 2.5 1.7 0 2.8-1.6 2.6-3.7 2.2 1.6 3.5 3.9 3.5 6.4A6.5 6.5 0 0 1 5.5 15.7c0-4.1 2.9-7.9 6.9-12.5Z" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </g>
    `,
    'layers': `
      <polygon class="isax-duotone isax-part isax-anim-up" points="12,3.5 20.5,8 12,12.5 3.5,8" fill="currentColor"/>
      <polygon class="isax-part isax-anim-up" points="12,3.5 20.5,8 12,12.5 3.5,8" stroke="currentColor" stroke-width="1.65" stroke-linejoin="round" fill="none"/>
      <path d="M3.5 12.2 12 16.7l8.5-4.5" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path class="isax-part isax-anim-breath" d="M3.5 16.2 12 20.7l8.5-4.5" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    `,
    'git-branch': `
      <circle class="isax-duotone" cx="7" cy="6" r="2.4" fill="currentColor"/>
      <circle cx="7" cy="6" r="2.4" stroke="currentColor" stroke-width="1.65" fill="none"/>
      <circle cx="7" cy="18" r="2.4" stroke="currentColor" stroke-width="1.65" fill="none"/>
      <circle class="isax-part isax-anim-up" cx="17" cy="8.5" r="2.4" stroke="currentColor" stroke-width="1.65" fill="none"/>
      <path d="M7 8.4v7.2" stroke="currentColor" stroke-width="1.65" stroke-linecap="round"/>
      <path class="isax-part isax-draw isax-anim-draw" d="M17 10.9c0 3.2-2.6 4.8-7.6 5.4" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" fill="none"/>
    `,
    'shield-tick': `
      <path class="isax-duotone" d="M12 2.8 4.8 5.6v5.7c0 4.8 3.1 8.8 7.2 10 4.1-1.2 7.2-5.2 7.2-10V5.6L12 2.8Z" fill="currentColor"/>
      <path d="M12 2.8 4.8 5.6v5.7c0 4.8 3.1 8.8 7.2 10 4.1-1.2 7.2-5.2 7.2-10V5.6L12 2.8Z" stroke="currentColor" stroke-width="1.65" stroke-linejoin="round" fill="none"/>
      <path class="isax-part isax-draw isax-anim-draw" d="M8.8 11.9 11 14.1 15.5 9.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    `,
    'lock': `
      <path class="isax-part isax-anim-lock" d="M8 10V7.5a4 4 0 0 1 8 0V10" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" fill="none"/>
      <rect class="isax-duotone" x="4.5" y="10" width="15" height="10.5" rx="3.2" fill="currentColor"/>
      <rect x="4.5" y="10" width="15" height="10.5" rx="3.2" stroke="currentColor" stroke-width="1.7" fill="none"/>
      <circle cx="12" cy="15.2" r="1.4" fill="currentColor"/>
    `,
    'warning': `
      <path class="isax-duotone" d="M10.4 4.3 3.1 17c-.7 1.2.2 2.7 1.6 2.7h14.6c1.4 0 2.3-1.5 1.6-2.7L13.6 4.3c-.7-1.2-2.5-1.2-3.2 0Z" fill="currentColor"/>
      <path class="isax-part isax-anim-breath" d="M10.4 4.3 3.1 17c-.7 1.2.2 2.7 1.6 2.7h14.6c1.4 0 2.3-1.5 1.6-2.7L13.6 4.3c-.7-1.2-2.5-1.2-3.2 0Z" stroke="currentColor" stroke-width="1.65" stroke-linejoin="round" fill="none"/>
      <path d="M12 9.2v4.3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      <circle cx="12" cy="16.4" r="1" fill="currentColor"/>
    `,
    'message': `
      <path class="isax-duotone" d="M8.5 19H8c-3.5 0-5-1.4-5-5V8c0-3.5 1.5-5 5-5h8c3.5 0 5 1.5 5 5v6c0 3.5-1.5 5-5 5h-.5c-.4 0-.9.2-1.2.6l-1.5 2c-.7.9-1.7.9-2.4 0l-1.5-2c-.3-.4-.8-.6-1.4-.6Z" fill="currentColor"/>
      <path d="M8.5 19H8c-3.5 0-5-1.4-5-5V8c0-3.5 1.5-5 5-5h8c3.5 0 5 1.5 5 5v6c0 3.5-1.5 5-5 5h-.5c-.4 0-.9.2-1.2.6l-1.5 2c-.7.9-1.7.9-2.4 0l-1.5-2c-.3-.4-.8-.6-1.4-.6Z" stroke="currentColor" stroke-width="1.65" stroke-linejoin="round" fill="none"/>
      <g class="isax-part isax-anim-breath" fill="currentColor">
        <circle cx="8.5" cy="11" r="1.1"/><circle cx="12" cy="11" r="1.1"/><circle cx="15.5" cy="11" r="1.1"/>
      </g>
    `,
    'terminal': `
      <rect class="isax-duotone" x="3" y="4.2" width="18" height="15.6" rx="3.4" fill="currentColor"/>
      <rect x="3" y="4.2" width="18" height="15.6" rx="3.4" stroke="currentColor" stroke-width="1.65" fill="none"/>
      <path class="isax-part isax-anim-right" d="M7.5 9.5 10.5 12l-3 2.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path class="isax-part isax-draw isax-anim-draw" d="M12.5 14.5h4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
    `,
    'file-text': `
      <path class="isax-duotone" d="M7 3.2h6.8L19 8.4v9.8c0 1.4-1.2 2.6-2.6 2.6H7.6C6.2 20.8 5 19.6 5 18.2V5.8C5 4.4 5.9 3.2 7 3.2Z" fill="currentColor"/>
      <path d="M7 3.2h6.8L19 8.4v9.8c0 1.4-1.2 2.6-2.6 2.6H7.6C6.2 20.8 5 19.6 5 18.2V5.8C5 4.4 5.9 3.2 7 3.2Z" stroke="currentColor" stroke-width="1.65" stroke-linejoin="round" fill="none"/>
      <path class="isax-part isax-draw isax-anim-draw" d="M8.5 12h7M8.5 15.8h4.8" stroke="currentColor" stroke-width="1.65" stroke-linecap="round"/>
    `,
    'award': `
      <circle class="isax-duotone" cx="12" cy="9.2" r="5.5" fill="currentColor"/>
      <circle class="isax-part isax-anim-breath" cx="12" cy="9.2" r="5.5" stroke="currentColor" stroke-width="1.65" fill="none"/>
      <path class="isax-part isax-anim-up" d="M8.8 14 7.2 21l4.8-2.4L16.8 21l-1.6-7" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    `,
    'sliders': `
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="1.65" stroke-linecap="round"/>
      <circle class="isax-part isax-anim-right" cx="9" cy="7" r="2" fill="currentColor"/>
      <circle class="isax-part isax-anim-left" cx="15" cy="12" r="2" fill="currentColor"/>
      <circle class="isax-part isax-anim-right" cx="10" cy="17" r="2" fill="currentColor"/>
    `,
    'microphone': `
      <rect class="isax-duotone" x="8.5" y="3" width="7" height="11.2" rx="3.5" fill="currentColor"/>
      <rect class="isax-part isax-anim-up" x="8.5" y="3" width="7" height="11.2" rx="3.5" stroke="currentColor" stroke-width="1.7" fill="none"/>
      <path class="isax-part isax-anim-breath" d="M5.2 11.4a6.8 6.8 0 0 0 13.6 0" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" fill="none"/>
      <path d="M12 18.2V21M8.8 21h6.4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
    `,
    'volume-high': `
      <path class="isax-duotone" d="M4.5 9.5h3.2l4.8-3.8c.8-.6 1.8-.1 1.8.9v10.8c0 1-1 1.5-1.8.9l-4.8-3.8H4.5c-.9 0-1.5-.6-1.5-1.5v-2c0-.9.6-1.5 1.5-1.5Z" fill="currentColor"/>
      <path d="M4.5 9.5h3.2l4.8-3.8c.8-.6 1.8-.1 1.8.9v10.8c0 1-1 1.5-1.8.9l-4.8-3.8H4.5c-.9 0-1.5-.6-1.5-1.5v-2c0-.9.6-1.5 1.5-1.5Z" stroke="currentColor" stroke-width="1.65" stroke-linejoin="round" fill="none"/>
      <path class="isax-part isax-anim-right" d="M17.3 9a4.4 4.4 0 0 1 0 6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" fill="none"/>
      <path class="isax-part isax-anim-breath" d="M19.8 6.8a7.4 7.4 0 0 1 0 10.4" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" fill="none"/>
    `,
    'volume-slash': `
      <path class="isax-duotone" d="M4.5 9.5h3.2l4.8-3.8c.8-.6 1.8-.1 1.8.9v10.8c0 1-1 1.5-1.8.9l-4.8-3.8H4.5c-.9 0-1.5-.6-1.5-1.5v-2c0-.9.6-1.5 1.5-1.5Z" fill="currentColor"/>
      <path d="M4.5 9.5h3.2l4.8-3.8c.8-.6 1.8-.1 1.8.9v10.8c0 1-1 1.5-1.8.9l-4.8-3.8H4.5c-.9 0-1.5-.6-1.5-1.5v-2c0-.9.6-1.5 1.5-1.5Z" stroke="currentColor" stroke-width="1.65" stroke-linejoin="round" fill="none"/>
      <path class="isax-part isax-draw isax-anim-draw" d="M16.5 9.5 21 14.5M21 9.5 16.5 14.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
    `,
    'stop-circle': `
      <circle class="isax-duotone" cx="12" cy="12" r="9.2" fill="currentColor"/>
      <circle cx="12" cy="12" r="9.2" stroke="currentColor" stroke-width="1.7" fill="none"/>
      <rect class="isax-part isax-anim-breath" x="8.8" y="8.8" width="6.4" height="6.4" rx="1.4" fill="currentColor"/>
    `,
    'copy': `
      <rect class="isax-duotone isax-part isax-anim-up" x="8.5" y="8.5" width="11.5" height="11.5" rx="2.6" fill="currentColor"/>
      <rect class="isax-part isax-anim-up" x="8.5" y="8.5" width="11.5" height="11.5" rx="2.6" stroke="currentColor" stroke-width="1.65" fill="none"/>
      <path d="M15.5 8.5V6.6C15.5 5.2 14.3 4 12.9 4H6.6C5.2 4 4 5.2 4 6.6v6.3c0 1.4 1.2 2.6 2.6 2.6h1.9" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" fill="none"/>
    `,
    'radar': `
      <circle class="isax-duotone" cx="12" cy="12" r="9.2" fill="currentColor"/>
      <circle class="isax-part isax-anim-breath" cx="12" cy="12" r="9.2" stroke="currentColor" stroke-width="1.65" stroke-dasharray="4 3" fill="none"/>
      <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="1.65" fill="none"/>
      <path class="isax-part isax-anim-spin-q" d="M12 12 17.5 6.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      <circle cx="12" cy="12" r="1.6" fill="currentColor"/>
    `
  };

  let dotLottieLoaded = false;
  function ensureDotLottiePlayer() {
    if (dotLottieLoaded || document.querySelector('script[data-dotlottie-wc]')) return;
    dotLottieLoaded = true;
    const s = document.createElement('script');
    s.type = 'module';
    s.dataset.dotlottieWc = 'true';
    s.src = 'https://unpkg.com/@lottiefiles/dotlottie-wc@latest/dist/dotlottie-wc.js';
    document.head.appendChild(s);
  }

  class IconsaxAnimated extends HTMLElement {
    static get observedAttributes() {
      return ['name', 'size', 'trigger', 'lottie-src'];
    }

    connectedCallback() {
      this.render();
    }

    attributeChangedCallback() {
      this.render();
    }

    play() {
      this.setAttribute('data-playing', 'true');
      clearTimeout(this._playTimer);
      this._playTimer = setTimeout(() => {
        this.removeAttribute('data-playing');
      }, 600);
    }

    render() {
      const size = Number(this.getAttribute('size') || 20);
      const name = (this.getAttribute('name') || 'compass').trim();
      const lottieSrc = this.getAttribute('lottie-src');

      this.style.width = `${size}px`;
      this.style.height = `${size}px`;
      if (!this.hasAttribute('aria-hidden') && !this.hasAttribute('aria-label')) {
        this.setAttribute('aria-hidden', 'true');
      }

      if (lottieSrc) {
        ensureDotLottiePlayer();
        const isAmbient = this.getAttribute('trigger') === 'ambient';
        this.innerHTML = `<dotlottie-wc src="${lottieSrc.replace(/"/g, '&quot;')}" ${isAmbient ? 'autoplay loop' : ''} style="width:${size}px;height:${size}px;"></dotlottie-wc>`;
        return;
      }

      const content = ICONS[name] || ICONS['compass'];
      this.innerHTML = `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
    }
  }

  if (!customElements.get('isax-anim')) {
    customElements.define('isax-anim', IconsaxAnimated);
  }

  window.IconsaxCatalog = Object.keys(ICONS);
})();
