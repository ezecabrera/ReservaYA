/*!
 * ReservaYa Embed Widget Installer
 *
 * Uso: pegar en el <head> o al final del <body> del sitio / Instagram tool:
 *
 *   <div data-reservaya-venue="VENUE_ID"></div>
 *   <script src="https://reservaya.app/embed.js" async></script>
 *
 * Crea un iframe dentro del div con el widget de reservas, y escucha
 * postMessage para auto-ajustar la altura. Sin dependencias externas.
 */
(function () {
  'use strict'

  // Origin base: lo inferimos del src del propio script para que sirva en
  // cualquier dominio donde alojemos el app (dev, staging, prod).
  var scriptEl =
    document.currentScript ||
    (function () {
      var scripts = document.getElementsByTagName('script')
      for (var i = scripts.length - 1; i >= 0; i--) {
        if (scripts[i].src && scripts[i].src.indexOf('embed.js') !== -1) {
          return scripts[i]
        }
      }
      return null
    })()

  if (!scriptEl) {
    console.warn('[reservaya:embed] no pude detectar el origin del script')
    return
  }

  var BASE = new URL(scriptEl.src).origin

  function mount(host) {
    var venueId = host.getAttribute('data-reservaya-venue')
    if (!venueId) return
    if (host.dataset.reservayaMounted === 'true') return
    host.dataset.reservayaMounted = 'true'

    var iframe = document.createElement('iframe')
    iframe.src = BASE + '/embed/' + encodeURIComponent(venueId)
    iframe.style.width = '100%'
    iframe.style.minHeight = '540px'
    iframe.style.border = '0'
    iframe.style.display = 'block'
    iframe.style.background = 'transparent'
    iframe.setAttribute('allow', 'payment')
    iframe.setAttribute('loading', 'lazy')
    iframe.setAttribute('title', 'Reservá tu mesa')

    host.innerHTML = ''
    host.appendChild(iframe)

    // Auto-resize: el widget postea su altura real
    window.addEventListener('message', function (event) {
      if (!event.data || event.data.type !== 'reservaya:resize') return
      if (event.source !== iframe.contentWindow) return
      var h = Number(event.data.height)
      if (isFinite(h) && h > 0) {
        iframe.style.height = h + 'px'
      }
    })
  }

  function boot() {
    var hosts = document.querySelectorAll('[data-reservaya-venue]')
    for (var i = 0; i < hosts.length; i++) mount(hosts[i])
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot)
  } else {
    boot()
  }
})()
