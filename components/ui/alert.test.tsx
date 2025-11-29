import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Alert, AlertTitle, AlertDescription } from './alert';

describe('Alert Component', () => {
  describe('Basic Rendering', () => {
    it('should render alert with role="alert"', () => {
      render(<Alert>Alert message</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('should render with default variant', () => {
      render(<Alert>Default alert</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('data-slot', 'alert');
    });

    it('should render alert content', () => {
      render(<Alert>Test alert content</Alert>);
      expect(screen.getByText('Test alert content')).toBeInTheDocument();
    });
  });

  describe('Alert Variants', () => {
    it('should render default variant', () => {
      render(<Alert variant="default">Default variant</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-card');
    });

    it('should render destructive variant', () => {
      render(<Alert variant="destructive">Destructive alert</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('text-destructive');
    });
  });

  describe('Alert with Icon', () => {
    it('should render alert with icon', () => {
      render(
        <Alert>
          <svg data-testid="alert-icon" />
          <AlertTitle>Title</AlertTitle>
        </Alert>
      );
      expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
    });

    it('should apply grid layout when icon is present', () => {
      render(
        <Alert>
          <svg data-testid="alert-icon" />
          <AlertTitle>With icon</AlertTitle>
        </Alert>
      );
      const alert = screen.getByRole('alert');
      // Component has grid classes
      expect(alert).toHaveClass('grid');
    });
  });

  describe('AlertTitle', () => {
    it('should render alert title', () => {
      render(
        <Alert>
          <AlertTitle>Alert Title</AlertTitle>
        </Alert>
      );
      expect(screen.getByText('Alert Title')).toBeInTheDocument();
    });

    it('should have correct data-slot attribute', () => {
      render(
        <Alert>
          <AlertTitle>Title</AlertTitle>
        </Alert>
      );
      const title = screen.getByText('Title');
      expect(title).toHaveAttribute('data-slot', 'alert-title');
    });

    it('should apply custom className to title', () => {
      render(
        <Alert>
          <AlertTitle className="custom-title">Title</AlertTitle>
        </Alert>
      );
      const title = screen.getByText('Title');
      expect(title).toHaveClass('custom-title');
    });
  });

  describe('AlertDescription', () => {
    it('should render alert description', () => {
      render(
        <Alert>
          <AlertDescription>Alert description text</AlertDescription>
        </Alert>
      );
      expect(screen.getByText('Alert description text')).toBeInTheDocument();
    });

    it('should have correct data-slot attribute', () => {
      render(
        <Alert>
          <AlertDescription>Description</AlertDescription>
        </Alert>
      );
      const description = screen.getByText('Description');
      expect(description).toHaveAttribute('data-slot', 'alert-description');
    });

    it('should apply custom className to description', () => {
      render(
        <Alert>
          <AlertDescription className="custom-desc">Description</AlertDescription>
        </Alert>
      );
      const description = screen.getByText('Description');
      expect(description).toHaveClass('custom-desc');
    });
  });

  describe('Complete Alert Structure', () => {
    it('should render complete alert with all components', () => {
      render(
        <Alert>
          <svg data-testid="alert-icon" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>Your changes have been saved.</AlertDescription>
        </Alert>
      );
      expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.getByText('Your changes have been saved.')).toBeInTheDocument();
    });

    it('should render alert without icon', () => {
      render(
        <Alert>
          <AlertTitle>No Icon</AlertTitle>
          <AlertDescription>Just title and description</AlertDescription>
        </Alert>
      );
      expect(screen.getByText('No Icon')).toBeInTheDocument();
      expect(screen.getByText('Just title and description')).toBeInTheDocument();
    });

    it('should render alert with title only', () => {
      render(
        <Alert>
          <AlertTitle>Title Only</AlertTitle>
        </Alert>
      );
      expect(screen.getByText('Title Only')).toBeInTheDocument();
    });

    it('should render alert with description only', () => {
      render(
        <Alert>
          <AlertDescription>Description only alert</AlertDescription>
        </Alert>
      );
      expect(screen.getByText('Description only alert')).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className to alert', () => {
      render(<Alert className="custom-alert">Custom</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('custom-alert');
    });

    it('should merge custom className with variant styles', () => {
      render(<Alert variant="destructive" className="extra-class">Alert</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('text-destructive');
      expect(alert).toHaveClass('extra-class');
    });
  });

  describe('Alert Use Cases', () => {
    it('should render success alert', () => {
      render(
        <Alert>
          <svg data-testid="check-icon" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>Operation completed successfully.</AlertDescription>
        </Alert>
      );
      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.getByText('Operation completed successfully.')).toBeInTheDocument();
    });

    it('should render error alert with destructive variant', () => {
      render(
        <Alert variant="destructive">
          <svg data-testid="error-icon" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Something went wrong.</AlertDescription>
        </Alert>
      );
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('text-destructive');
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('should render info alert', () => {
      render(
        <Alert>
          <svg data-testid="info-icon" />
          <AlertTitle>Information</AlertTitle>
          <AlertDescription>Please review the following details.</AlertDescription>
        </Alert>
      );
      expect(screen.getByText('Information')).toBeInTheDocument();
      expect(screen.getByText('Please review the following details.')).toBeInTheDocument();
    });

    it('should render warning alert', () => {
      render(
        <Alert>
          <svg data-testid="warning-icon" />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>This action cannot be undone.</AlertDescription>
        </Alert>
      );
      expect(screen.getByText('Warning')).toBeInTheDocument();
      expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have role="alert" for screen readers', () => {
      render(<Alert>Alert message</Alert>);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should be accessible with title and description', () => {
      render(
        <Alert>
          <AlertTitle>Accessible Title</AlertTitle>
          <AlertDescription>Accessible description for screen readers</AlertDescription>
        </Alert>
      );
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(screen.getByText('Accessible Title')).toBeInTheDocument();
      expect(screen.getByText('Accessible description for screen readers')).toBeInTheDocument();
    });
  });

  describe('Description with Multiple Paragraphs', () => {
    it('should render description with nested paragraph', () => {
      render(
        <Alert>
          <AlertTitle>Title</AlertTitle>
          <AlertDescription>
            <p>First paragraph</p>
            <p>Second paragraph</p>
          </AlertDescription>
        </Alert>
      );
      expect(screen.getByText('First paragraph')).toBeInTheDocument();
      expect(screen.getByText('Second paragraph')).toBeInTheDocument();
    });

    it('should render description with mixed content', () => {
      render(
        <Alert>
          <AlertDescription>
            <p>Paragraph text</p>
            <button>Action button</button>
          </AlertDescription>
        </Alert>
      );
      expect(screen.getByText('Paragraph text')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action button' })).toBeInTheDocument();
    });
  });
});
