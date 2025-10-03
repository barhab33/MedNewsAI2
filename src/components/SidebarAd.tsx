import AdSense from './AdSense';

export default function SidebarAd() {
  return (
    <div className="hidden lg:block sticky top-4">
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 p-4">
        <div className="text-center mb-2">
          <span className="text-xs text-gray-400 uppercase tracking-wide">Advertisement</span>
        </div>
        <div className="flex justify-center items-center" style={{ minHeight: '600px', width: '300px' }}>
          <AdSense
            adSlot="1122334455"
            adFormat="vertical"
            style={{ width: '300px', height: '600px' }}
            fullWidthResponsive={false}
          />
        </div>
      </div>
    </div>
  );
}
