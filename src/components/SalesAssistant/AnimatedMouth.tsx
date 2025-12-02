interface AnimatedMouthProps {
  isActive: boolean;
}

export const AnimatedMouth = ({ isActive }: AnimatedMouthProps) => {
  if (!isActive) return null;
  
  return (
    <div className="absolute bottom-[35%] left-1/2 -translate-x-1/2 z-10 pointer-events-none">
      <svg 
        viewBox="0 0 40 20" 
        className="w-8 h-4"
        style={{
          animation: 'mouth-talk 0.3s ease-in-out infinite'
        }}
      >
        <ellipse 
          cx="20" 
          cy="10" 
          rx="15" 
          ry="8" 
          fill="#cc6666"
          className="origin-center"
        />
      </svg>
    </div>
  );
};
