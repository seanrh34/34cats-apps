export function Footer() {
  return (
    <footer className="px-4 py-12 border-t border-gray-800">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">34cats Apps</h3>
            <p className="text-sm text-gray-400">
              Building innovative digital experiences, one app at a time.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <a href="/#apps" className="text-sm text-gray-400 hover:text-[#E84A3A] transition-colors">
                  Apps
                </a>
              </li>
              <li>
                <a href="/#about" className="text-sm text-gray-400 hover:text-[#E84A3A] transition-colors">
                  About
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Get in Touch</h4>
            <a
              href="mailto:contact@34cats.com"
              className="text-sm text-gray-400 hover:text-[#E84A3A] transition-colors"
            >
              contact@34cats.com
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center text-gray-400 pt-8 border-t border-gray-800">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} 34cats. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
