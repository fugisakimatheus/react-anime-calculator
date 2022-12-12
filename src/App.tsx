/* eslint-disable no-eval */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { format } from "date-fns";
import {
  Box,
  Flex,
  Button,
  SimpleGrid,
  MdIcon,
  Divider,
  Text,
  useBreakpointValue,
} from "@fugisaki/design-system";
import extractColors from "extract-colors";

const numpad = [7, 8, 9, "÷", 4, 5, 6, "×", 1, 2, 3, "-", 0, ",", "=", "+"];
const characters = ["+", "-", "×", "÷"];

function App() {
  const isMobile = useBreakpointValue({ base: true, sm: true, md: false });
  const uploadRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [editBackground, setEditBackground] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(true);
  const [history, setHistory] = useState<string[]>([]);
  const [operation, setOperation] = useState<string>("");
  const [date, setDate] = useState<Date>(new Date());

  const applyRegex = (value: string, remove = false) => {
    if (!value) return value;
    // eslint-disable-next-line no-useless-escape
    const acceptedRegex = /[^$0-9÷*×+-\/().]/g;
    return value
      .replaceAll(acceptedRegex, "")
      .replaceAll(!remove ? "*" : "×", !remove ? "×" : "*")
      .replaceAll(!remove ? "." : ",", !remove ? "," : ".")
      .replaceAll(!remove ? "/" : "÷", !remove ? "÷" : "/");
  };

  const handleInputFocus = useCallback(() => {
    if (isMobile) return;
    inputRef.current?.focus();
  }, [isMobile]);

  const handleChangeOperaton = (value: any) => {
    const valueIsNumber = !isNaN(value);
    const lastCharacterIsSpecial = isNaN(String(operation).slice(0, -1) as any);
    if (
      (lastCharacterIsSpecial && valueIsNumber) ||
      (valueIsNumber && !lastCharacterIsSpecial)
    ) {
    }
    setOperation(value);
  };

  const handleCalculate = () => {
    const lastOperation = history[history.length - 1];
    if (lastOperation !== operation) {
      setHistory(history.concat([operation]));
    }
    handleChangeOperaton(eval(applyRegex(operation, true)));
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop += 800;
      }
    }, 150);
  };

  const handleConcatOperation = (character: number | string) => {
    handleChangeOperaton(`${operation}${character}`);
  };

  const handleRemoveLastCharacter = () => {
    handleInputFocus();
    handleChangeOperaton(String(operation).slice(0, -1));
  };

  const handleReset = () => {
    handleInputFocus();
    handleChangeOperaton("");
    setHistory([]);
  };

  const handleClickCharacter = (character: string | number) => {
    handleInputFocus();
    if (character === "=") {
      handleCalculate();
      return;
    }
    if (typeof character === "string" && ["+", "-"].includes(character)) {
      handleConcatOperation(character);
      return;
    }
    if (typeof character === "number") {
      handleConcatOperation(character);
      return;
    }
    if (character === ",") {
      handleConcatOperation(".");
      return;
    }
    if (character === "×") {
      handleConcatOperation("*");
      return;
    }
    if (character === "÷") {
      handleConcatOperation("/");
    }
  };

  const handleEnterPress = (event: any) => {
    if (event.key === "Enter" || event.code === "Equal") {
      handleInputFocus();
      handleCalculate();
    }
  };

  const handleLoadImage = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const img = event.target;
    if (!img || !img.files) return;
    const file = img.files[0];

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const imageString = reader.result as string;
      extractColors(imageString).then(console.log).catch(console.error);
    };
    reader.onerror = (error) => {
      console.error("Error on load image", error);
    };
  };

  const getStyles = (value: number | string) => {
    if (typeof value === "string" && characters.includes(value)) {
      return {
        bgColor: "#C7DAD9",
        color: "#06192E",
        border: "2px solid transparent",
        transitionDuration: "220ms",
        _hover: {
          bgColor: "#06192E",
          color: "#C7DAD9",
          borderColor: "#C7DAD9",
        },
        _active: {
          bgColor: "#06192E",
          color: "#C7DAD9",
          borderColor: "#C7DAD9",
        },
      };
    }

    return {
      bgColor: "#06192E",
      color: "#C7DAD9",
      transitionDuration: "220ms",
      border: "2px solid transparent",
      _hover: {
        bgColor: "#C7DAD9",
        color: "#06192E",
        borderColor: "#06192E",
      },
      _active: {
        bgColor: "#C7DAD9",
        color: "#06192E",
        borderColor: "#06192E",
      },
    };
  };

  useEffect(() => {
    handleInputFocus();

    const interval = setInterval(() => {
      setDate(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, [handleInputFocus]);

  return (
    <Flex
      width="100vw"
      height="100vh"
      justify="center"
      bgColor="#99CDD1"
      filter="brightness(92%)"
      align="center"
      position="relative"
    >
      <img
        src="./wallpaper.jpg"
        alt="wallpaper"
        style={{
          position: "absolute",
          display: "block",
          objectFit: "cover",
          width: "100%",
          height: "100%",
        }}
      />

      {editBackground && (
        <Box
          zIndex={9999999}
          position="absolute"
          bgColor="#06192E"
          height={{ base: "100%", sm: "100%", md: "540px" }}
          maxWidth="800px"
          width="100%"
          borderRadius={{ base: "none", sm: "none", md: "md" }}
        >
          <Flex padding="2" justify="space-between" align="center">
            <Flex>
              <Button
                variant={isUploading ? "solid" : "outline"}
                color={isUploading ? "#06192E" : "#C7DAD9"}
                _hover={{
                  color: isUploading ? "#06192E" : "#C7DAD9",
                  opacity: 0.8,
                }}
                _active={{
                  color: isUploading ? "#06192E" : "#C7DAD9",
                }}
                size="sm"
                marginRight="2"
                onClick={() => setIsUploading(true)}
              >
                Upload de imagem
              </Button>
              <Button
                variant={isUploading ? "outline" : "solid"}
                color={!isUploading ? "#06192E" : "#C7DAD9"}
                _hover={{
                  color: !isUploading ? "#06192E" : "#C7DAD9",
                  opacity: 0.8,
                }}
                _active={{
                  color: !isUploading ? "#06192E" : "#C7DAD9",
                }}
                size="sm"
                onClick={() => setIsUploading(false)}
              >
                Todas as imagens
              </Button>
            </Flex>

            <MdIcon
              name="MdClose"
              color="#C7DAD9"
              size="md"
              onClick={() => setEditBackground(false)}
            />
          </Flex>

          <Flex align="center" justify="center" height="86%">
            <input
              ref={uploadRef}
              type="file"
              hidden
              onChange={handleLoadImage}
            />
            <Box
              onClick={() => uploadRef.current?.click()}
              border="2px dashed #C7DAD9"
              padding="8"
              width="500px"
              cursor="pointer"
              textAlign="center"
              borderRadius="sm"
            >
              <MdIcon name="MdImage" color="#C7DAD9" size="lg" />
              <Text color="#C7DAD9" fontWeight="semibold" marginTop="4">
                Fazer upload de imagem
              </Text>
            </Box>
          </Flex>
        </Box>
      )}
      <Box position="absolute" top="24px" right="24px">
        <MdIcon
          name="MdImage"
          color="#C7DAD9"
          size="lg"
          onClick={() => setEditBackground(true)}
        />
      </Box>
      <Box
        minWidth={{ base: "100%", sm: "300px" }}
        marginBottom="3"
        paddingTop={{ base: "10", sm: "10", md: "20" }}
        paddingX="4"
      >
        <Box
          minWidth="100%"
          padding="2"
          marginBottom="12"
          borderRadius="md"
          bgColor="rgba(11, 49, 78, 0.3)"
          boxShadow="0 4px 30px rgba(0, 0, 0, 0.2)"
          backdropFilter="blur(2px)"
          border="1px solid rgba(6, 25, 46, 0.06)"
          color="#06192E"
          textAlign="center"
        >
          <Text fontSize="1xl">{format(date, "dd/MM/yyyy")}</Text>
          <Text fontSize="2xl" fontWeight="bold">
            {format(date, "HH:mm:ss")}
          </Text>
        </Box>
        <Box
          minWidth="100%"
          borderRadius="md"
          padding="4"
          bgColor="rgba(11, 49, 78, 0.38)"
          boxShadow="0 4px 30px rgba(0, 0, 0, 0.2)"
          backdropFilter="blur(2px)"
          border="1px solid rgba(6, 25, 46, 0.1)"
        >
          <Flex
            paddingX="4"
            height="110px"
            bgColor="#06192E"
            borderRadius="md"
            align="flex-end"
            justify="flex-end"
            color="#C7DAD9"
            direction="column"
            paddingY="2"
          >
            <Box
              ref={scrollRef}
              textAlign="end"
              height="100%"
              width="100%"
              overflow="auto"
              css={{
                "&::-webkit-scrollbar": {
                  width: "0px",
                },
                "&::-webkit-scrollbar-track": {
                  width: "0px",
                },
                "&::-webkit-scrollbar-thumb": {
                  background: "transparent",
                },
              }}
            >
              {history.map((operation, index) => (
                <Text
                  key={index}
                  marginBottom="1"
                  cursor="pointer"
                  marginTop={
                    history.length === 1
                      ? "35px"
                      : history.length === 2 && index === 0
                      ? "10px"
                      : "none"
                  }
                  onClick={() => setOperation(operation)}
                >
                  {applyRegex(operation)}
                </Text>
              ))}
            </Box>

            <Divider bgColor="#C7DAD9" />

            <Box marginTop="1">
              <input
                ref={inputRef}
                value={applyRegex(String(operation))}
                type="text"
                style={{
                  background: "#06192E",
                  color: "#C7DAD9",
                  outline: "none",
                  fontWeight: "bold",
                  textAlign: "end",
                  width: "100%",
                }}
                onKeyUp={handleEnterPress}
                onChange={(event) => handleChangeOperaton(event.target.value)}
              />
            </Box>
          </Flex>

          <Flex direction="column" marginTop="4">
            <SimpleGrid columns={2} gap="2" marginTop="2" textAlign="end">
              <Button
                variant="solid"
                borderRadius="md"
                {...getStyles("AC")}
                onClick={handleReset}
              >
                AC
              </Button>
              <Button
                variant="solid"
                borderRadius="md"
                {...getStyles("back")}
                onClick={handleRemoveLastCharacter}
              >
                <MdIcon name="MdBackspace" size="sm" />
              </Button>
            </SimpleGrid>

            <SimpleGrid columns={4} gap="2" marginTop="2">
              {numpad.map((character) => (
                <Button
                  key={character}
                  variant="solid"
                  borderRadius="md"
                  {...getStyles(character)}
                  onClick={() => handleClickCharacter(character)}
                >
                  {character}
                </Button>
              ))}
            </SimpleGrid>
          </Flex>
        </Box>
      </Box>
    </Flex>
  );
}

export default App;
