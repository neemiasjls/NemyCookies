package com.nemycookies.config;

import com.nemycookies.model.Category;
import com.nemycookies.model.Product;
import com.nemycookies.repository.CategoryRepository;
import com.nemycookies.repository.ProductRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.util.Map;

@Configuration
public class DataInitializer {

    // Foto de cada sabor (servidas pelo frontend em /public/cookies)
    private static final Map<String, String> IMAGES = Map.of(
            "Cookie KitKat", "/cookies/kitkat.jpg",
            "Cookie Nutella", "/cookies/nutella.jpg",
            "Cookie Ovomaltine", "/cookies/ovomaltine.jpg",
            "Cookie Kinder Bueno", "/cookies/kinder.jpg"
    );

    @Bean
    public CommandLineRunner initData(CategoryRepository categoryRepo, ProductRepository productRepo) {
        return args -> {
            if (categoryRepo.count() == 0) {
                Category cat = new Category();
                cat.setName("COOKIES RECHEADOS");
                cat.setDescription("Cookies artesanais com chocolate nobre, recheio cremoso e finalização especial. Feitos sob encomenda.");
                cat.setDisplayOrder(1);
                categoryRepo.save(cat);

                productRepo.save(build("Cookie KitKat",
                        "Creme de KitKat crocante no centro e 1 pedaço de KitKat em cima para finalizar. Aproximadamente 110g.",
                        "18.00", cat));
                productRepo.save(build("Cookie Nutella",
                        "Creme de Nutella no centro e 1 pedacinho do wafer de Nutella B-Ready em cima para finalizar.",
                        "18.00", cat));
                productRepo.save(build("Cookie Ovomaltine",
                        "Creme de Ovomaltine crocante no centro e pedacinhos de Ovomaltine Rocks por cima do cookie para finalizar.",
                        "18.00", cat));
                productRepo.save(build("Cookie Kinder Bueno",
                        "Creme de Kinder Bueno White com Kinder Bueno White original no recheio e um pedacinho de Kinder Bueno White em cima para finalizar.",
                        "20.00", cat));
            }

            // Garante a foto de cada sabor (idempotente — corrige tambem bancos ja existentes)
            productRepo.findAll().forEach(p -> {
                String url = IMAGES.get(p.getName());
                if (url != null && !url.equals(p.getImageUrl())) {
                    p.setImageUrl(url);
                    productRepo.save(p);
                }
            });
        };
    }

    private Product build(String name, String description, String price, Category cat) {
        Product p = new Product();
        p.setName(name);
        p.setDescription(description);
        p.setPrice(new BigDecimal(price));
        p.setStock(0);
        p.setAvailable(false);
        p.setCategory(cat);
        return p;
    }
}
