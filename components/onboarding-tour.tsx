'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface OnboardingStep {
  title: string;
  description: string;
  icon: string;
  action?: {
    label: string;
    href: string;
  };
}

const steps: OnboardingStep[] = [
  {
    title: 'Welcome to Bakalr CMS',
    description: 'Let\'s take a quick tour to help you get started with your content management system.',
    icon: '👋',
  },
  {
    title: 'Create Content Types',
    description: 'Define the structure of your content by creating content types. Think of them as blueprints for your content.',
    icon: '📋',
    action: {
      label: 'Go to Content Types',
      href: '/dashboard/content-types',
    },
  },
  {
    title: 'Add Your Content',
    description: 'Once you have content types, you can start creating content entries. Use the rich text editor, upload media, and add translations.',
    icon: '📝',
    action: {
      label: 'Create Content',
      href: '/dashboard/content',
    },
  },
  {
    title: 'Manage Your Team',
    description: 'Invite team members and assign roles with specific permissions to control access to your content.',
    icon: '👥',
    action: {
      label: 'Invite Users',
      href: '/dashboard/users',
    },
  },
  {
    title: 'Customize Your Experience',
    description: 'Set up your organization settings, configure languages, and customize the theme to match your brand.',
    icon: '⚙️',
    action: {
      label: 'Organization Settings',
      href: '/dashboard/organization',
    },
  },
];

export function OnboardingTour() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding) {
      // Show onboarding after a short delay
      setTimeout(() => setOpen(true), 1000);
    }
  }, []);

  const handleClose = () => {
    setOpen(false);
    localStorage.setItem('hasSeenOnboarding', 'true');
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAction = () => {
    const action = steps[currentStep].action;
    if (action) {
      handleClose();
      router.push(action.href);
    }
  };

  const currentStepData = steps[currentStep];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="text-6xl">{currentStepData.icon}</div>
          </div>
          <DialogTitle className="text-center">{currentStepData.title}</DialogTitle>
          <DialogDescription className="text-center">
            {currentStepData.description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center gap-2 my-4">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-2 rounded-full transition-colors ${
                index === currentStep ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        <div className="flex justify-between gap-3">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            Previous
          </Button>

          <div className="flex gap-2">
            {currentStepData.action && (
              <Button variant="outline" onClick={handleAction}>
                {currentStepData.action.label}
              </Button>
            )}
            
            <Button onClick={handleNext}>
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
            </Button>
          </div>
        </div>

        <button
          onClick={handleClose}
          className="text-xs text-muted-foreground hover:text-foreground text-center mt-2"
        >
          Skip tour
        </button>
      </DialogContent>
    </Dialog>
  );
}
