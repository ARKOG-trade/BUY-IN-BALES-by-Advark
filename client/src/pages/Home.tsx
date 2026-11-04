import { ArrowDown, ArrowRight, ArrowUpRight, BadgeCheck, Boxes, ChartNoAxesCombined, Globe2, Handshake, PackageCheck, Sparkles } from "lucide-react";
import { Link } from "wouter";
import SiteShell from "@/components/SiteShell";

const heroImage = "/manus-storage/async-images/Op4X45ag1pwtc996kQV0DI/image-1.webp";

export default function Home() {
  return (
    <SiteShell>
      <section className="hero-wrap">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> Okrika bales, built for business</div>
          <h1>A bale in.<br /><em>A business moving.</em></h1>
          <p className="hero-lede">BUY IN BALES connects bale buyers with local retailers—so good second-hand fashion finds its people, and every partner has a clear way to earn.</p>
          <div className="hero-actions">
            <Link href="/register" className="button button-orange">Join the network <ArrowUpRight size={17} /></Link>
            <a href="#models" className="text-link">Explore the options <ArrowDown size={16} /></a>
          </div>
          <div className="hero-proof"><span><BadgeCheck size={16} /> Clear deal terms</span><span><ChartNoAxesCombined size={16} /> Progress you can track</span></div>
        </div>
        <div className="hero-art" role="img" aria-label="Curated second-hand clothing spilling from an open bale in a warm fashion studio" style={{ backgroundImage: `url('${heroImage}')` }}>
          <div className="hero-sticker"><span>THE NEXT<br />CHAPTER</span><span className="sticker-spark">✳</span></div>
          <div className="hero-caption"><span>01 / FROM BALE TO BUSINESS</span><span>BUY IN BALES — ADVARK</span></div>
        </div>
        <div className="hero-index"><span>01</span><span className="index-line" /><span>03</span></div>
      </section>

      <section className="ticker-strip" aria-label="Business highlights">
        <span>BUY A BALE</span><i>✳</i><span>BUILD YOUR SHOP</span><i>✳</i><span>SELL TOGETHER</span><i>✳</i><span>TRACK YOUR PROGRESS</span><i>✳</i><span>BUY A BALE</span>
      </section>

      <section className="section section-models" id="models">
        <div className="section-heading heading-split">
          <div><p className="eyebrow">Two ways to get in</p><h2>Make the bale<br /><em>work for you.</em></h2></div>
          <p>Start with a bale for your own shop, or fund a bale and partner with a retailer who knows their customers. Choose the route that fits your business.</p>
        </div>
        <div className="model-feature">
          <article className="model-card model-card-primary">
            <div className="model-number">01 / YOUR OWN SHOP</div>
            <div className="model-icon"><Boxes size={24} /></div>
            <h3>Buy it.<br />Build your rack.</h3>
            <p>Purchase a bale for your own business. Pick, price, and sell the pieces your way—your shop, your pace.</p>
            <Link href="/register" className="card-link">I’m buying for my shop <ArrowRight size={16} /></Link>
          </article>
          <article className="model-card model-card-partner">
            <div className="model-number">02 / SELL TOGETHER</div>
            <div className="model-icon"><Handshake size={24} /></div>
            <h3>Back a bale.<br />Share the upside.</h3>
            <p>Fund a bale and let a local retailer sell it. Agree on one clear return model before the bale moves.</p>
            <div className="deal-options">
              <div><span className="deal-tag">FIXED RETURN</span><p>Retailer sells the bale and returns your capital plus the agreed fixed profit percentage.</p></div>
              <div><span className="deal-tag deal-tag-orange">PROFIT SHARE</span><p>Share the profit: <strong>40% to the bale buyer</strong>, <strong>60% to the retailer</strong>.</p></div>
            </div>
            <Link href="/register" className="card-link">Explore retailer partnerships <ArrowRight size={16} /></Link>
          </article>
        </div>
        <p className="fine-print">The fixed profit percentage is agreed for each bale arrangement. It is not preset by this website.</p>
      </section>

      <section className="process-band">
        <div className="process-title"><p className="eyebrow eyebrow-light">From first bale to next move</p><h2>Simple steps.<br /><em>Shared progress.</em></h2><Link href="/register" className="button button-outline-light">Get started <ArrowUpRight size={16} /></Link></div>
        <div className="process-list">
          <div className="process-step"><span>01</span><div><h3>Choose your role</h3><p>Join as a retailer or wholesaler and set up your business profile.</p></div></div>
          <div className="process-step"><span>02</span><div><h3>Choose your route</h3><p>Buy for your own shop or agree how a retailer will sell the bale.</p></div></div>
          <div className="process-step"><span>03</span><div><h3>Keep the numbers moving</h3><p>Retailers post progress updates. Wholesalers see shared results in one place.</p></div></div>
        </div>
      </section>

      <section className="section section-progress">
        <div className="progress-art"><div className="progress-stamp">SELL<br />WITH<br />PURPOSE</div><div className="progress-bars"><span /><span /><span /><span /><span /><span /><span /></div><div className="progress-art-label">A clear view<br />of every move.</div></div>
        <div className="progress-copy"><p className="eyebrow">Good work deserves a clear report</p><h2>Every update<br /><em>counts.</em></h2><p>Retailers can log pieces sold, revenue, expenses, and notes as a bale moves. Their dashboard keeps the activity in one place, so progress is easier to understand—not buried in a chat.</p><ul className="check-list"><li><PackageCheck size={17} /> Keep a record for each bale</li><li><ChartNoAxesCombined size={17} /> See retailer-reported totals at a glance</li><li><BadgeCheck size={17} /> Share your business progress with wholesalers when you choose</li></ul><Link href="/register" className="text-link text-link-ink">Open your business dashboard <ArrowRight size={16} /></Link></div>
      </section>

      <section className="partner-cta">
        <div className="partner-cta-icon"><Globe2 size={27} /></div>
        <div className="partner-cta-copy"><p className="eyebrow">Supply meets local know-how</p><h2>From China and London<br /><em>to local storefronts.</em></h2><p>Suppliers and retailers can start a conversation about sourcing and selling together—one local partnership at a time.</p></div>
        <Link href="/partners" className="button button-dark">Explore partnerships <ArrowUpRight size={17} /></Link>
        <Sparkles className="partner-spark" size={34} />
      </section>
    </SiteShell>
  );
}
