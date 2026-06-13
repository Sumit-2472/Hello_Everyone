import { Link } from 'react-router-dom';
import { Leaf, ShieldCheck, RotateCcw, TrendingUp, ArrowRight } from 'lucide-react';

const stats = [
  { label: 'Products Reused', value: '145K+', icon: '♻️' },
  { label: 'CO₂ Saved', value: '320 tons', icon: '🌍' },
  { label: 'Waste Prevented', value: '500kg/day', icon: '🗑️' },
  { label: 'Returns Prevented', value: '40%', icon: '📦' },
];

const features = [
  {
    icon: <RotateCcw className="w-6 h-6 text-relife-orange" />,
    title: 'Return Prevention',
    description: 'AI predicts return probability before you buy. Get size recommendations and compatibility checks.',
    link: '/returns',
  },
  {
    icon: <ShieldCheck className="w-6 h-6 text-relife-green" />,
    title: 'AI Product Passport',
    description: 'Every returned product receives a digital health certificate — graded by Gemini Vision AI.',
    link: '/passport',
  },
  {
    icon: <TrendingUp className="w-6 h-6 text-blue-500" />,
    title: 'Second Life Marketplace',
    description: 'Discover certified refurbished products with full transparency via Trust Cards.',
    link: '/marketplace',
  },
  {
    icon: <Leaf className="w-6 h-6 text-relife-green" />,
    title: 'Green Credits',
    description: 'Earn credits for sustainable choices. Redeem for discounts and cashback.',
    link: '/credits',
  },
];

export default function HomePage() {
  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="text-center py-16 px-4">
        <div className="inline-flex items-center gap-2 bg-relife-green-light text-relife-green text-sm font-semibold px-3 py-1.5 rounded-full mb-4">
          <Leaf className="w-4 h-4" />
          AI-Powered Circular Commerce
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-relife-navy mb-4">
          Amazon <span className="text-relife-orange">ReLife</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Prevent unnecessary returns, intelligently process unavoidable ones, and ensure every product finds its <span className="text-relife-green font-semibold">next best owner</span>.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/marketplace" className="btn-primary inline-flex items-center gap-2">
            Explore Marketplace <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/returns" className="btn-secondary inline-flex items-center gap-2">
            Check Return Risk
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {stats.map((stat) => (
          <div key={stat.label} className="card text-center">
            <p className="text-3xl mb-1">{stat.icon}</p>
            <p className="text-2xl font-bold text-relife-navy">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* Features */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-relife-navy mb-6 text-center">How ReLife Works</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {features.map((feature) => (
            <Link key={feature.title} to={feature.link} className="card hover:shadow-md transition-shadow group">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-gray-50 rounded-lg flex-shrink-0">{feature.icon}</div>
                <div>
                  <h3 className="font-semibold text-relife-navy mb-1 group-hover:text-relife-orange transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Flow diagram */}
      <section className="card text-center mb-8">
        <h2 className="text-xl font-bold text-relife-navy mb-6">The ReLife Flow</h2>
        <div className="flex flex-wrap justify-center items-center gap-2 text-sm font-medium">
          {['Buy', '→', 'AI Prevention', '→', 'Fewer Returns'].map((step, i) => (
            <span key={i} className={step === '→' ? 'text-gray-400' : 'bg-relife-orange text-white px-3 py-1.5 rounded-full'}>
              {step}
            </span>
          ))}
          <span className="text-gray-400 mx-2">|</span>
          {['If Returned', '→', 'AI Passport', '→', 'Smart Routing', '→', 'Next Owner 🌱'].map((step, i) => (
            <span key={i} className={step === '→' ? 'text-gray-400' : 'bg-relife-green text-white px-3 py-1.5 rounded-full'}>
              {step}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
