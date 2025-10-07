import { Button } from "./ui/button";
import Image from "next/image";

const formatPhoneForWhatsApp = (phone: string) => {
    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');
    return digitsOnly;
  };

  export default function WhatsappButton({ phone }: { phone: string }) {
    const handleWhatsAppClick = () => {
        if (phone) {
          const formattedPhone = formatPhoneForWhatsApp(phone);
          const whatsappUrl = `https://wa.me/${formattedPhone}`;
          window.open(whatsappUrl, '_blank');
        }
      };
    return (
      <Button
                      variant="outline"
                      size="sm"
                      onClick={handleWhatsAppClick}
                      className="ml-2"
                    >
                        <Image
                        width={20}
                        height={20}
                        src="whatsapp.svg"
                        alt="WhatsApp"
                        className="h-5 w-5 hover:cursor-pointer"
                      />
                    </Button>
    );
  }