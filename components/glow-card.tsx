// Simple placeholder component for glow card
import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface GlowCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}

export function GlowCard({
  title,
  children,
  className = '',
  glowColor = 'rgba(0, 255, 255, 0.3)'
}: GlowCardProps) {
  return (
    <Card 
      className={cn(
        "relative border-slate-700 bg-slate-800/50 backdrop-blur-sm overflow-hidden",
        className
      )}
      style={{
        boxShadow: `0 0 15px ${glowColor}`,
      }}
    >
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, ${glowColor} 0%, transparent 70%)`,
          opacity: 0.1
        }}
      />
    </Card>
  );
}
