# Source files

Version 1.3 uses a smooth vector trace derived from the user's supplied blue-green pin/check. The original screenshot and pixel-identical crop remain unmodified under original-icon. The trace is a new vector rendition of the supplied reference; it is not an original vector uploaded by the user.

The vector master is Oprino-icon-vector-master.svg. Its clean paths and gradients are in icon-vector-data.json and rendered by vector_icon.py. The lowercase wordmark uses Unbounded Medium 500 with -0.012 em tracking. Headings use Space Grotesk 600; body uses Manrope 400.

Install requirements.txt, then run build_assets.py followed by build_guidelines.py. Fontconfig and Cairo must be available. Font files and licenses are included. To regenerate the trace from the original crop, install numpy and scipy, then run trace_icon_source.py before the builders.

All logo SVG/PDF files use native vector paths and gradients. PNG masters are rendered at 4096 px with clean antialiasing. Standard app/avatar exports remain 1024 px, with 4096 px copies in 02-Digital/4K. Social, cover and web templates have 2x PNG exports. Letterhead is exported at approximately 300 dpi A4.
