import { useRef, forwardRef, useImperativeHandle } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';

interface HCaptchaProps {
  siteKey: string;
  onVerify?: (token: string) => void;
  onExpire?: () => void;
  onError?: (error: string) => void;
  theme?: 'light' | 'dark';
  size?: 'normal' | 'compact';
  className?: string;
}

export interface HCaptchaRef {
  reset: () => void;
  execute: () => void;
}

const HCaptchaComponent = forwardRef<HCaptchaRef, HCaptchaProps>(
  ({ siteKey, onVerify, onExpire, onError, theme = 'light', size = 'normal', className }, ref) => {
    const captchaRef = useRef<HCaptcha>(null);

    useImperativeHandle(ref, () => ({
      reset: () => {
        captchaRef.current?.resetCaptcha();
      },
      execute: () => {
        captchaRef.current?.execute();
      },
    }));

    const handleVerify = (token: string) => {
      onVerify?.(token);
    };

    const handleExpire = () => {
      onExpire?.();
    };

    const handleError = (error: string) => {
      onError?.(error);
    };

    return (
      <div className={className}>
        <HCaptcha
          ref={captchaRef}
          sitekey={siteKey}
          onVerify={handleVerify}
          onExpire={handleExpire}
          onError={handleError}
          theme={theme}
          size={size}
        />
      </div>
    );
  }
);

HCaptchaComponent.displayName = 'HCaptchaComponent';

export default HCaptchaComponent;
