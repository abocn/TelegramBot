import Image from "next/image";
import USFlag from "../assets/flags/en.webp";
import BRFlag from "../assets/flags/br.svg";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

export function LanguageChooser() {
    return (
        <Select>
            <SelectTrigger>
                <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="en">
                    <div className="flex items-center gap-2">
                        <Image src={USFlag} alt="English" width={20} height={20} />
                    </div>
                    English
                </SelectItem>
                <SelectItem value="pt">
                    <div className="flex items-center gap-2">
                        <Image src={BRFlag} alt="Portuguese" width={20} height={20} />
                    </div>
                    Português
                </SelectItem>
            </SelectContent>
        </Select>
    );
}