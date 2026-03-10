import { FieldError, InputGroup, Label, TextField } from "heroui-native";
import { useState } from "react";
import { Pressable } from "react-native";
import Svg, { Circle, Line, Path } from "react-native-svg";

interface AuthInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  isPassword?: boolean;
  errorMessage?: string;
  keyboardType?: React.ComponentProps<typeof InputGroup.Input>["keyboardType"];
  autoCapitalize?: React.ComponentProps<typeof InputGroup.Input>["autoCapitalize"];
  autoComplete?: React.ComponentProps<typeof InputGroup.Input>["autoComplete"];
}

export function AuthInput({
  label,
  value,
  onChangeText,
  placeholder,
  isPassword,
  errorMessage,
  keyboardType,
  autoCapitalize,
  autoComplete,
}: AuthInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <TextField isInvalid={!!errorMessage}>
      <Label>{label}</Label>
      <InputGroup>
        <InputGroup.Input
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={isPassword && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
        />
        {isPassword ? (
          <InputGroup.Suffix>
            <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
              {showPassword ? (
                <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="#78716C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <Line x1="1" y1="1" x2="23" y2="23" />
                </Svg>
              ) : (
                <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="#78716C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <Circle cx={12} cy={12} r={3} />
                </Svg>
              )}
            </Pressable>
          </InputGroup.Suffix>
        ) : null}
      </InputGroup>
      {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
    </TextField>
  );
}
