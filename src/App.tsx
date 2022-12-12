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
  Image,
  useBreakpointValue,
} from "@fugisaki/design-system";
import extractColors from "extract-colors";
import localforage from "localforage";
import { v4 as uuidv4 } from "uuid";

localforage.config({
  driver: localforage.INDEXEDDB,
  name: "react-calculator",
  version: 1.0,
});

type StorageImage = {
  id: string;
  image: string;
};

type RGB = {
  r: number;
  g: number;
  b: number;
};

const numpad = [7, 8, 9, "÷", 4, 5, 6, "×", 1, 2, 3, "-", 0, ",", "=", "+"];
const characters = ["+", "-", "×", "÷"];

function App() {
  const isMobile = useBreakpointValue({ base: true, sm: true, md: false });

  const uploadRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [storageImages, setStorageImages] = useState<StorageImage[]>([]);
  const [editBackground, setEditBackground] = useState<boolean>(false);
  const [selectedImageId, setSelectedImageId] = useState<string>("");
  const [currentForeground, setCurrentForeground] = useState<string>("");
  const [currentBackground, setCurrentBackground] = useState<string>("");
  const [currentRGB, setCurrentRGB] = useState<RGB | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [operation, setOperation] = useState<string>("");
  const [date, setDate] = useState<Date>(new Date());

  const selectedImage =
    storageImages.find((storageImage) => storageImage.id === selectedImageId)
      ?.image || "./wallpaper.jpg";

  const foreground = currentForeground || "#C7DAD9";
  const background = currentBackground || "#06192E";
  const rgb = currentRGB || { r: 11, g: 49, b: 78 };

  const applyRegex = (value: string, remove = false) => {
    if (!value) return value;
    // eslint-disable-next-line no-useless-escape
    const acceptedRegex = /[^0-9÷*×+\-,\/()]/g;
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

  const handleInitializeColors = useCallback(async () => {
    const selectedImage = storageImages.find(
      (image) => image.id === selectedImageId
    );

    if (!selectedImage) return;

    const colors = await extractColors(selectedImage.image);
    const sortedColors = colors.sort((a, b) => a.lightness - b.lightness);

    const background = sortedColors[0];
    const foreground = sortedColors[sortedColors.length - 1];

    const isSameColor = background?.hex === foreground?.hex;
    const isLight = isSameColor && background?.lightness > 0.5;
    const isDark = isSameColor && background?.lightness <= 0.5;

    setCurrentBackground(background?.hex);
    setCurrentForeground(isLight ? "#000" : isDark ? "#FFF" : foreground?.hex);
    setCurrentRGB({
      r: background?.red || 0,
      g: background?.green || 0,
      b: background?.blue || 0,
    });
  }, [selectedImageId, storageImages]);

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

  const handleRemoveImage = async (id: string) => {
    const newImages = storageImages.filter((image) => image.id !== id);
    setStorageImages(newImages);
    await localforage.setItem("images", newImages);
    if (selectedImageId === id) {
      setCurrentBackground("");
      setCurrentForeground("");
      setCurrentRGB(null);
      await localforage.removeItem("selectedImage");
    }
  };

  const handleSelectImage = async (id: string) => {
    setSelectedImageId(id);
    await localforage.setItem("selectedImage", id);
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
      setStorageImages((old) => [...old, { id: uuidv4(), image: imageString }]);
      // extractColors(imageString).then(console.log).catch(console.error);
    };
    reader.onerror = (error) => {
      console.error("Error on load image", error);
    };
  };

  useEffect(() => {
    const handleSaveImages = async () => {
      await localforage.setItem("images", JSON.stringify(storageImages));
    };
    handleSaveImages();
  }, [storageImages]);

  useEffect(() => {
    handleInitializeColors();
  }, [selectedImageId, handleInitializeColors]);

  useEffect(() => {
    handleInputFocus();

    const handleInitializeImages = async () => {
      const storedImages = await localforage.getItem<string>("images");
      const imageId = await localforage.getItem<string>("selectedImage");
      const images = JSON.parse(storedImages || "[]") as StorageImage[];
      if (imageId) {
        setSelectedImageId(imageId);
      }
      setStorageImages(images);
    };

    handleInitializeImages();

    const interval = setInterval(() => {
      setDate(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, [handleInputFocus]);

  const getStyles = (value: number | string) => {
    if (typeof value === "string" && characters.includes(value)) {
      return {
        bgColor: foreground,
        color: background,
        transitionDuration: "220ms",
        border: `1px solid ${background}`,
        _hover: {
          bgColor: background,
          color: foreground,
          borderColor: foreground,
        },
        _active: {
          bgColor: background,
          color: foreground,
          borderColor: foreground,
        },
      };
    }

    return {
      bgColor: background,
      color: foreground,
      transitionDuration: "220ms",
      border: `1px solid ${foreground}`,
      _hover: {
        bgColor: foreground,
        color: background,
        borderColor: background,
      },
      _active: {
        bgColor: foreground,
        color: background,
        borderColor: background,
      },
    };
  };

  return (
    <Flex
      width="100vw"
      height="100vh"
      justify="center"
      filter="brightness(92%)"
      align="center"
      position="relative"
    >
      <img
        src={selectedImage}
        alt="wallpaper"
        style={{
          userSelect: "none",
          pointerEvents: "none",
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
          bgColor={background}
          height={{ base: "100%", sm: "100%", md: "540px" }}
          maxWidth="800px"
          width="100%"
          padding="2"
          borderRadius={{ base: "none", sm: "none", md: "md" }}
        >
          <Flex padding="2" justify="space-between" align="center">
            <Flex paddingX="1">
              <Text color={foreground} fontSize="18px" fontWeight="semibold">
                Upload de imagem
              </Text>
            </Flex>

            <MdIcon
              name="MdClose"
              color={foreground}
              size="md"
              onClick={() => setEditBackground(false)}
            />
          </Flex>

          <Flex paddingX="3" paddingTop="2">
            <input
              ref={uploadRef}
              type="file"
              hidden
              onChange={handleLoadImage}
            />
            <Flex
              onClick={() => uploadRef.current?.click()}
              border={`2px solid ${foreground}`}
              padding="1"
              cursor="pointer"
              align="center"
              borderRadius="md"
              _hover={{ opacity: 0.8 }}
            >
              <MdIcon
                name="MdImage"
                color={foreground}
                size="lg"
                marginRight="1"
              />
              <Text
                color={foreground}
                fontSize="14px"
                fontWeight="semibold"
                marginRight="1"
              >
                Fazer upload de imagem
              </Text>
            </Flex>
          </Flex>

          <SimpleGrid padding="3" gap="3" columns={3}>
            {storageImages.map(({ id, image }) => (
              <Box key={id} position="relative" width="fit-content">
                <Image
                  src={image}
                  cursor="pointer"
                  maxHeight="150px"
                  border={
                    selectedImageId === id
                      ? "3px solid lime"
                      : "3px solid transparent"
                  }
                  onClick={() => handleSelectImage(id)}
                />
                <Box position="absolute" top="-6px" right="-6px">
                  <Box
                    backgroundColor="white"
                    width="24px"
                    borderRadius="99999999px"
                    cursor="pointer"
                    _hover={{ filter: "brightness(80%)" }}
                    onClick={() => handleRemoveImage(id)}
                  >
                    <MdIcon name="MdRemoveCircle" color="red" size="md" />
                  </Box>
                </Box>
              </Box>
            ))}
          </SimpleGrid>
        </Box>
      )}
      <Box position="absolute" top="24px" right="24px">
        <MdIcon
          name="MdImage"
          color={foreground}
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
          bgColor={`rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35)`}
          boxShadow="0 4px 30px rgba(0, 0, 0, 0.2)"
          backdropFilter="blur(2px)"
          border="1px solid rgba(6, 25, 46, 0.06)"
          color={foreground}
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
          bgColor={`rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35)`}
          boxShadow="0 4px 30px rgba(0, 0, 0, 0.2)"
          backdropFilter="blur(2px)"
          border="1px solid rgba(6, 25, 46, 0.1)"
        >
          <Flex
            paddingX="4"
            height="110px"
            bgColor={background}
            border={`1px solid ${foreground}`}
            borderRadius="md"
            align="flex-end"
            justify="flex-end"
            color={foreground}
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

            <Divider bgColor={foreground} />

            <Box marginTop="1">
              <input
                ref={inputRef}
                value={applyRegex(String(operation))}
                type="text"
                style={{
                  background: background,
                  color: foreground,
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
